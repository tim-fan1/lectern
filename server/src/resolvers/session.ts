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
import { Session, User } from "../entities/entities";
import { Context, EndpointResponse } from "../types";

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
}

@Resolver()
export default class SessionResolver {
    @Authorized()
    @Query(() => SessionArrResponse)
    async getSessions(
        @Ctx() { conn, res }: Context
    ): Promise<SessionArrResponse> {
        try {
            const user = await conn
                .getRepository(User)
                .findOne(res.locals.userId);

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
            const sessionRepo = conn.getRepository(Session);
            const newSession = sessionRepo.create({
                name: name,
                group: group,
                // savedActivities: activities,
            });
            await sessionRepo.save(newSession);

            const userRepo = conn.getRepository(User);
            const user = await userRepo.findOne(res.locals.userId);
            if (user === undefined)
                return SessionResponse.withErrors({
                    kind: SessionErrors.USER_NOT_EXIST,
                });

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
            const targetSession = await sessionRepo.findOne(id);

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
            const targetSession = await sessionRepo.findOne(id);

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

            sessionRepo.delete(id);
            return { errors: [] };
        } catch (e: Error | any) {
            return SessionResponse.withErrors({
                kind: SessionErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }
}
