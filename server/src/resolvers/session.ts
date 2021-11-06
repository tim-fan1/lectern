import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    PubSub,
    PubSubEngine,
} from "type-graphql";
import * as df from "date-fns";
import { Activity, Session, User } from "../entities/entities";
import { AuthedContext, Context, EndpointResponse } from "../types";
import generateAlphanumCode from "../utils/generateCode";
import CheckAuth from "../utils/authMiddleware";
import { DeepPartial, getRepository } from "typeorm";
import LiveSession from "../utils/liveSession";
import { getSession } from "../utils/modifySession";

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
    SESSION_NAME_ALREADY_EXIST = "SESSION_NAME_ALREADY_EXIST",
    INVALID_CHOICE = "INVALID_CHOICE",
    INVALID_ACTIVITY = "INVALID_ACTIVITY", // TODO move to activity.ts
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
        name = name.trim();
        try {
            if (
                user.sessions.filter((session) => session.name === name)
                    .length !== 0
            ) {
                return EndpointResponse.withErrors({
                    kind: SessionErrors.SESSION_NAME_ALREADY_EXIST,
                    msg: "A session with the same name already exists",
                });
            }
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
                // TODO: do or don't enforce uniqueness?
                entity.name = name.trim();
            }
            if (group !== undefined) {
                entity.group = group.trim();
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
        @Arg("id", () => Int) id: number,
        @Ctx() { conn, user, openSessions }: AuthedContext,
        @PubSub() pubsub: PubSubEngine
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
            openSessions.set(
                session.id,
                new LiveSession(conn, pubsub, session)
            );

            return { errors: [], session: session };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @CheckAuth(["sessions"])
    @Mutation(() => SessionResponse)
    async duplicateSession(
        @Arg("id", () => Int) id: number,
        @Arg("name") newName: string,
        @Ctx() { conn, user }: AuthedContext
    ): Promise<SessionResponse> {
        newName = newName.trim();
        const srcSess = user.sessions.find((s) => s.id === id);
        /* for now, only allow duplication of draft or archived sessions */
        if (srcSess === undefined || srcSess.state === "open")
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });
        if (user.sessions.find((s) => s.name === newName) !== undefined) {
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NAME_ALREADY_EXIST,
            });
        }

        /* Clone the relevant fields from the session as a TypeORM DeepPartial */
        const newSessPartial: DeepPartial<Session> = {
            name: newName,
            author: user,
            group: srcSess.group,
            activities: srcSess.activities.map((a) => {
                return {
                    name: a.name,
                    kind: a.kind,
                    session: newSess,
                    state: "draft",
                    choices: a.choices.map((c) => {
                        return { name: c.name };
                    }),
                };
            }),
        };

        /* Save to session repo (hope the cascades work!) */
        const newSess = await conn.getRepository(Session).save(newSessPartial);

        return { errors: [], session: newSess };
    }

    @Query(() => SessionResponse)
    async sessionDetails(
        @Arg("code") code: string,
        @Ctx() { conn, openSessions }: Context
    ): Promise<SessionResponse> {
        const result = await getSession(openSessions, { code: code });
        if (result.isLeft) {
            return SessionResponse.withErrors(result.data);
        } else {
            return { errors: [], session: result.data };
        }
    }
}
