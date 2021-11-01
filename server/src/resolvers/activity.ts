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
import { getRepository } from "typeorm";
import { Activity, Session } from "../entities/entities";
import { EndpointResponse, Context } from "../types";

@ObjectType()
class ActivityResponse extends EndpointResponse {
    @Field({ nullable: true })
    activity?: Activity;
}

@ObjectType()
class ActivityArrResponse extends EndpointResponse {
    @Field(() => [Activity], { nullable: true })
    activities?: Activity[];
}

enum ActivityErrors {
    DB_ERROR = "DB_ERROR",
    USER_NOT_EXIST = "USER_NOT_EXIST", // shouldn't be possible but ts complains
    SESSION_NOT_EXIST = "SESSION_NOT_EXIST",
    ACTIVITY_NOT_EXIST = "ACTIVITY_NOT_EXIST",
    KIND_NOT_EXIT = "KIND_NOT_EXIST",
}

enum ActivityKinds {
    POLL = "POLL",
}

@Resolver()
export default class ActivityResolver {
    @Query(() => ActivityArrResponse)
    async getActivities(
        @Arg("session_id") session_id: string,
        @Ctx() { conn }: Context
    ): Promise<ActivityArrResponse> {
        try {
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: session_id },
            });
            if (session === undefined)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            return { errors: [], activities: session.activities };
        } catch (e: Error | any) {
            return ActivityResponse.withErrors({
                kind: ActivityErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Mutation(() => ActivityResponse)
    async createActivity(
        @Arg("session_id") session_id: string,
        @Arg("name") name: string,
        @Arg("kind") kind: string,
        @Ctx() { conn }: Context
    ): Promise<ActivityResponse> {
        try {
            /* Validate kind. */
            kind = kind.trim().toUpperCase();
            if (!(kind in ActivityKinds)) {
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.KIND_NOT_EXIT,
                    msg: "An activity of that kind can not be created",
                });
            }
            /* Find the session the user wants to add an activity to. */
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: session_id },
            });
            if (session === undefined)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            /* Create empty activity of kind. */
            const activityRepo = conn.getRepository(Activity);
            const activity = activityRepo.create({
                kind: kind,
                name: name,
                session: session,
                choices: [],
            });
            await activityRepo.save(activity);
            /* Insert that activity into session.activities. */
            session.activities.push(activity);
            await sessionRepo.save(session);
            /* Success! */
            return {
                errors: [],
                activity: activity,
            };
        } catch (e: Error | any) {
            return ActivityResponse.withErrors({
                kind: ActivityErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Mutation(() => ActivityResponse)
    async addToPoll(
        @Arg("session_id") session_id: String,
        @Arg("activity_id") activity_id: String,
        @Arg("name") name: String
    ): Promise<ActivityResponse> {
        return {
            errors: [],
        };
    }
}
