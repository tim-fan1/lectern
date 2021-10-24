import {
    Arg,
    Authorized,
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
import { Context, EndpointResponse } from "../types";
import generateAlphanumCode from "../utils/generateCode";

@ObjectType()
class SessionResponse extends EndpointResponse {
    @Field({ nullable: true })
    session?: Session;
}

@ObjectType()
class SessionArrResponse extends EndpointResponse {
    @Field(() => [Session], { nullable: true })
    sessions?: Session[];
}

enum SessionErrors {
    DB_ERROR = "DB_ERROR",
    USER_NOT_EXIST = "USER_NOT_EXIST", // shouldn't be possible but ts complains
    SESSION_NOT_EXIST = "SESSION_NOT_EXIST",
    SESSION_INVALID_STATE = "SESSION_INVALID_STATE",
    SESSION_CODE_EXIST = "SESSION_CODE_EXIST",
}

@Resolver()
export default class SessionResolver {
    @Authorized()
    @Query(() => SessionArrResponse)
    async getSessions(@Ctx() { conn, res }: Context): Promise<SessionArrResponse> {
        try {
            const user = await conn.getRepository(User).findOne(res.locals.userId);

            if (user === undefined)
                return SessionResponse.withErrors({
                    kind: SessionErrors.USER_NOT_EXIST,
                });

            return {
                errors: [],
                sessions: user.sessions,
            };
        } catch (e: Error | any) {
            return SessionArrResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Authorized()
    @Mutation(() => SessionResponse)
    async createSession(
        @Ctx() { res, conn }: Context,
        @Arg("name") name: string,
        @Arg("group", { nullable: true }) group?: string
        // @Arg("activities", () => [Activity], { nullable: true }) activities?: Activity[]
    ): Promise<SessionResponse> {
        try {
            const userRepo = conn.getRepository(User);
            const user = await userRepo.findOne(res.locals.userId);
            if (user === undefined)
                return SessionResponse.withErrors({
                    kind: SessionErrors.USER_NOT_EXIST,
                });

            const sessionRepo = conn.getRepository(Session);
            const newSession = sessionRepo.create({
                name: name,
                group: group,
                author: user,
                // savedActivities: activities,
            });
            await sessionRepo.save(newSession);

            user.sessions.push(newSession);
            await userRepo.save(user);

            return { errors: [], session: newSession };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    /* TODO add more edit fields? and define entity type properly */
    @Authorized()
    @Mutation(() => EndpointResponse)
    async editSession(
        @Ctx() { res, conn }: Context,
        @Arg("id", () => Int) id: number,
        @Arg("name", { nullable: true }) name?: string,
        @Arg("group", { nullable: true }) group?: string
        /// @Arg("activities", () => [Activity], { nullable: true }) activities?: Activity[]
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
            if (targetSession.author.id !== res.locals.userId)
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

    @Authorized()
    @Mutation(() => EndpointResponse)
    async deleteSession(
        @Ctx() { res, conn }: Context,
        @Arg("id", () => Int) id: number
    ): Promise<EndpointResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const targetSession = await sessionRepo.findOne(id, {
                relations: ["author"],
            });

            if (targetSession === undefined || targetSession.author.id !== res.locals.userId)
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

    @Authorized()
    @Mutation(() => SessionResponse)
    async startSession(
        @Arg("id") id: number,
        @Ctx() { res, conn }: Context
    ): Promise<SessionResponse> {
        try {
            const userRepo = conn.getRepository(User);
            const user = await userRepo.findOne(res.locals.userId);
            if (user === undefined)
                return SessionResponse.withErrors({
                    kind: SessionErrors.USER_NOT_EXIST,
                });

            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(id, {
                relations: ["author"],
            });
            if (session === undefined || session.author.id !== res.locals.userId)
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });
            if (session.state !== "draft")
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_INVALID_STATE,
                });

            /* In-memory session logic goes here. */

            const thisCode = generateAlphanumCode(6);
            if ((await sessionRepo.findOne({ where: { code: thisCode } })) !== undefined)
                // code already exists, somewhat unlikely (unlike session token)
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_CODE_EXIST,
                    msg: "Code already exists; don't buy a lottery ticket \
                        but maybe roll some gacha or something",
                });

            session.code = thisCode;
            session.state = "open";
            // TODO: make this configurable; default for now is 6 hours
            session.startTime = new Date(Date.now());
            session.endTime = df.add(session.startTime, { hours: 6 });
            await sessionRepo.save(session);

            return { errors: [], session: session };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Authorized()
    @Mutation(() => SessionResponse)
    async closeSession(
        @Arg("id") id: number,
        @Ctx() { res, conn }: Context
    ): Promise<SessionResponse> {
        try {
            const userRepo = conn.getRepository(User);
            const user = await userRepo.findOne(res.locals.userId);
            if (user === undefined)
                return SessionResponse.withErrors({
                    kind: SessionErrors.USER_NOT_EXIST,
                });

            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(id, {
                relations: ["author"],
            });
            if (session === undefined || session.author.id !== res.locals.userId)
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_NOT_EXIST,
                });
            if (session.state !== "open")
                return SessionResponse.withErrors({
                    kind: SessionErrors.SESSION_INVALID_STATE,
                });

            session.state = "archived";
            session.endTime = new Date(Date.now());
            await sessionRepo.save(session);

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
        @Ctx() { conn }: Context
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

            return { errors: [], session: thisSession };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }
}
