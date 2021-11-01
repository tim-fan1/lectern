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
import { Activity, Session, Choice } from "../entities/entities";
import { EndpointResponse, AuthedContext } from "../types";
import CheckAuth from "../utils/authMiddleware";

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
    @CheckAuth(["sessions"])
    @Query(() => ActivityArrResponse)
    async getActivities(
        @Arg("session_id") session_id: string,
        @Ctx() { user }: AuthedContext
    ): Promise<ActivityArrResponse> {
        try {
            /* Does the session pointed by id belong to user? */
            const sessions = user.sessions.filter(
                (session) => session.id === parseInt(session_id, 10)
            );
            if (sessions.length !== 1) {
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            }
            return { errors: [], activities: sessions[0].activities };
        } catch (e: Error | any) {
            return ActivityResponse.withErrors({
                kind: ActivityErrors.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async createActivity(
        @Arg("session_id") session_id: string,
        @Arg("name") name: string,
        @Arg("kind") kind: string,
        @Ctx() { conn, user }: AuthedContext
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
            /* Does the session pointed by id belong to user? */
            const sessions = user.sessions.filter(
                (session) => session.id === parseInt(session_id, 10)
            );
            if (sessions.length !== 1) {
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            }
            const session = sessions[0];
            /* Update activity repo. */
            const activityRepo = conn.getRepository(Activity);
            const activity = activityRepo.create({
                kind: kind,
                name: name,
                session: session,
                choices: [],
            });
            await activityRepo.save(activity);
            /* Update session repo. */
            const sessionRepo = conn.getRepository(Session);
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

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async addChoice(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Arg("name") name: string,
        @Ctx() { conn, user }: AuthedContext
    ): Promise<ActivityResponse> {
        try {
            /* Does the session pointed by id belong to user? */
            const sessions = user.sessions.filter(
                (session) => session.id === parseInt(session_id, 10)
            );
            if (sessions.length !== 1) {
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            }
            const session = sessions[0];
            /* Does the activity pointed by id belong to session (that we know belongs to user)? */
            const activities = session.activities.filter(
                (activity) => activity.id === parseInt(activity_id, 10)
            );
            if (activities.length !== 1) {
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                    msg: "Activity does not exist",
                });
            }
            const activity = activities[0];
            /* Update choice repo. */
            const choiceRepo = conn.getRepository(Choice);
            const choice = choiceRepo.create({
                name: name,
                votes: 0,
                activity: activity,
            });
            await choiceRepo.save(choice);
            /* Update activity repo */
            const activityRepo = conn.getRepository(Activity);
            activity.choices.push(choice);
            await activityRepo.save(activity);
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
}
