import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { Session, Activity, User } from "../entities/entities";
import { Context } from "../types";

@Resolver()
export default class SessionResolver {
    @Query(() => [Session])
    async getSessions(
        @Ctx() { conn, res }: Context
    ): Promise<Session[] | null> {
        if (res.locals.userId === undefined) {
            return null;
        }

        return conn
            .getRepository(User)
            .findOne(res.locals.userId)
            .then((user) => {
                return user?.sessions ? user?.sessions : [];
            });
    }

    @Mutation(() => Boolean)
    async createSession(
        @Ctx() { res, conn }: Context,
        @Arg("name") name: string,
        @Arg("group", { nullable: true }) group?: string,
        // @Arg("activities", () => [Activity], { nullable: true }) activities?: Activity[]
    ): Promise<Boolean> {
        if (res.locals.userId === undefined) {
            return false;
        }

        const sessionRepo = conn.getRepository(Session);
        const newSession = sessionRepo.create({
            name: name,
            group: group,
            // savedActivities: activities,
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

    @Mutation(() => Boolean)
    async editSession(
        @Ctx() { res, conn }: Context,
        @Arg("id", () => Int) id: number,
        @Arg("name", { nullable: true }) name?: string,
        @Arg("group", { nullable: true }) group?: string,
        /// @Arg("activities", () => [Activity], { nullable: true }) activities?: Activity[]
    ): Promise<Boolean> {
        if (res.locals.userId === undefined) {
            return false;
        }

        const sessionRepo = conn.getRepository(Session);
        try {
            let entity: any = {}
            if (name !== undefined) {
                entity.name = name;
            }
            if (group !== undefined) {
                entity.group = group;
            }

            await sessionRepo.update(id, entity);
        } catch (e) {
            console.log(e)
        }

        return true;
    }

    @Mutation(() => Boolean)
    async deleteSession(
        @Ctx() { res, conn }: Context,
        @Arg("id", () => Int) id: number
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
