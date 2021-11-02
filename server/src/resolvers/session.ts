import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import * as df from "date-fns";
import { Session, User } from "../entities/entities";
import { AuthedContext, Context, EndpointResponse } from "../types";
import generateAlphanumCode from "../utils/generateCode";
import CheckAuth from "../utils/authMiddleware";
import { getRepository } from "typeorm";
import LiveSession from "../utils/liveSession";

// TODO: this is exported for use in sessionSubscription; should it be somewhere
// else like types.ts?
@ObjectType()
export class SessionResponse extends EndpointResponse {
    @Field({ nullable: true })
    session?: Session;
}

@ObjectType()
class SessionArrResponse extends EndpointResponse {
    @Field(() => [Session], { nullable: true })
    sessions?: Session[];
}

export enum SessionErrors {
    DB_ERROR = "DB_ERROR",
    USER_NOT_EXIST = "USER_NOT_EXIST", // shouldn't be possible but ts complains
    SESSION_NOT_EXIST = "SESSION_NOT_EXIST",
    SESSION_INVALID_STATE = "SESSION_INVALID_STATE",
    SESSION_CODE_EXIST = "SESSION_CODE_EXIST",
    SESSION_CLOSED = "SESSION_CLOSED",
}

@Resolver()
export default class SessionResolver {
    @CheckAuth(["sessions"])
    @Query(() => SessionArrResponse)
    async getSessions(
        @Ctx() { user }: AuthedContext,
        @Arg("id", { nullable: true }) id: string
    ): Promise<SessionArrResponse> {
        /* Hopefully i understood authedcontext correctly when i did this merge main kek. */
        return {
            errors: [],
            sessions:
                id === undefined
                    ? user.sessions
                    : user.sessions.filter(
                          (session) => session.id === parseInt(id, 10)
                      ),
        };
    }

    @CheckAuth(["sessions"])
    @Mutation(() => SessionResponse)
    async createSession(
        @Ctx() { conn, user }: AuthedContext,
        @Arg("name") name: string,
        @Arg("group", { nullable: true }) group?: string
    ): Promise<SessionResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const newSession = sessionRepo.create({
                name: name,
                group: group,
                author: user,
                activities: [],
            });
            await sessionRepo.save(newSession);

            user.sessions.push(newSession);
            await getRepository(User).save(user);

            return { errors: [], session: newSession };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    /* TODO: add more edit fields? and define entity type properly */
    @CheckAuth()
    @Mutation(() => EndpointResponse)
    async editSession(
        @Ctx() { conn, user }: AuthedContext,
        @Arg("id", () => Int) id: number,
        @Arg("name", { nullable: true }) name?: string,
        @Arg("group", { nullable: true }) group?: string
    ): Promise<EndpointResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const targetSession = await sessionRepo.findOne(id, {
                relations: ["author"],
            });

            if (targetSession === undefined)
                return EndpointResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });
            if (targetSession.author.id !== user.id)
                // I don't think we should reveal that this session exists if
                // this author isn't allowed to access it
                return EndpointResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });

            let entity: { name?: string; group?: string } = {};
            if (name !== undefined) {
                entity.name = name;
            }
            if (group !== undefined) {
                entity.group = group;
            }
            await sessionRepo.update(id, entity);

            return { errors: [] };
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @CheckAuth()
    @Mutation(() => EndpointResponse)
    async deleteSession(
        @Ctx() { conn, user }: AuthedContext,
        @Arg("id", () => Int) id: number
    ): Promise<EndpointResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const targetSession = await sessionRepo.findOne(id, {
                relations: ["author"],
            });

            if (
                targetSession === undefined ||
                targetSession.author.id !== user.id
            )
                // I don't think we should reveal that this session exists if
                // this user isn't allowed to access it
                return EndpointResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });

            sessionRepo.delete(id);
            return { errors: [] };
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @CheckAuth()
    @Mutation(() => SessionResponse)
    async startSession(
        @Arg("id") id: number,
        @Ctx() { conn, user, openSessions }: AuthedContext
    ): Promise<SessionResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(id, {
                relations: ["author"],
            });
            if (session === undefined || session.author.id !== user.id)
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });
            if (session.state !== "draft")
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_INVALID_STATE,
                });

            /* Generate session code */
            const thisCode = generateAlphanumCode(6);
            if (
                (await sessionRepo.findOne({ where: { code: thisCode } })) !==
                undefined
            )
                // code already exists, somewhat unlikely (unlike session token)
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_CODE_EXIST,
                    msg: "Code already exists; don't buy a lottery ticket \
                        but maybe roll some gacha or something",
                });

            session.code = thisCode;
            session.state = "open";
            // TODO: make this configurable; default for now is 6 hours
            session.startTime = new Date();
            session.endTime = df.add(session.startTime, { hours: 6 });
            await sessionRepo.save(session);

            /* Add session to openSessions TODO: set up auto-end somewhere here */
            openSessions.set(session.id, new LiveSession(conn, session));

            return { errors: [], session: session };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Query(() => SessionResponse)
    async sessionDetails(
        @Arg("code") code: string,
        @Ctx() { conn, openSessions }: Context
    ): Promise<SessionResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const thisSession = await sessionRepo.findOne({
                where: { code: code.trim().toUpperCase() },
                relations: ["author"],
            });
            if (thisSession === undefined || thisSession.state !== "open")
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist or has not been opened",
                });

            /* If session is open, return the in-memory session instead
             * This raises the question: why do we store & query live sessions
             * by id instead of code? The important part is that the frontend
             * uses an id; codes can be re-used, but ids cannot, so the frontend
             * won't accidentally get data from another session if it queries
             * using ids. This is a really unlikely case but yeah haha hafdsv */
            const thisLive = openSessions.get(thisSession.id);

            return {
                errors: [],
                session: thisLive ? thisLive.session : thisSession,
            };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }
}
