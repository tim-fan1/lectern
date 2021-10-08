import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import Session, { Activity } from "../entities/Session";
import User from "../entities/User";
import { Context } from "../types";

@Resolver()
export default class SessionResolver {
    @Query()
    async getSessions(
        @Ctx() { conn, res }: Context
    ): Promise<[Session] | null> {
        if (res.locals.userId === undefined) {
            return null;
        }

        return conn
            .getRepository(User)
            .findOne(res.locals.userId)
            .then((user) => {
                return user?.sessions ? user?.sessions : null;
            });
    }

    @Mutation()
    async createSession(
        @Ctx() { res, conn }: Context,
        @Arg("name") name: string,
        @Arg("group") group?: string,
        @Arg("activities") activities?: [Activity]
    ): Promise<Boolean> {
        if (res.locals.userId === undefined) {
            return false;
        }

        const sessionRepo = conn.getRepository(Session);
        const newSession = sessionRepo.create({
            name: name,
            group: group,
            savedActivities: activities,
        });
        await sessionRepo.save(newSession);
        const userRepo = conn.getRepository(User);
        let user = await userRepo.findOne(res.locals.userId);

        if (user && user?.sessions) {
            user.sessions.push(newSession);
            await userRepo.save(user);
        } else if (user) {
            user.sessions = [newSession];
            await userRepo.save(user);
        }

        return true;
    }

    @Mutation()
    async editSession(
        @Ctx() { res, conn }: Context,
        @Arg("id") id: number,
        @Arg("name") name?: string,
        @Arg("group") group?: string,
        @Arg("activities") activities?: [Activity]
    ): Promise<Boolean> {
        if (res.locals.userId === undefined) {
            return false;
        }

        const sessionRepo = conn.getRepository(Session);
        try {
            sessionRepo.update(id, {
                name: name,
                group: group,
                savedActivities: activities,
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    @Mutation()
    async deleteSession(
        @Ctx() { res, conn }: Context,
        @Arg("id") id: number
    ): Promise<Boolean> {
        if (res.locals.userId === undefined) {
            return false;
        }

        const sessionRepo = conn.getRepository(Session);
        const targetSession = await sessionRepo.findOne(id);

        if (!targetSession) {
            return false;
        }

        try {
            sessionRepo.delete(id);
        } catch (e) {
            return false;
        }

        return true;
    }
}
