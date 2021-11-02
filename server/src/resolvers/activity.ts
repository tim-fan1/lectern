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
    ACTIVITY_INVALID_STATE = "ACTIVITY_INVALID_STATE",
    ACTIVITY_NAME_ALREADY_EXIST = "ACTIVITY_NAME_ALREADY_EXIST",
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
        @Ctx() { user, conn }: AuthedContext
    ): Promise<ActivityArrResponse> {
        try {
            /* Does the session pointed by id belong to user? */
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(session_id, {
                relations: ["author", "activities"],
            });
            if (session === undefined || session.author.id !== user.id)
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
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(session_id, {
                relations: ["author", "activities"],
            });
            if (session === undefined || session.author.id !== user.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            if (
                session.activities.filter((activity) => activity.name === name)
                    .length !== 1
            ) {
                return EndpointResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_NAME_ALREADY_EXIST,
                    msg: "An activity with the same name already exists",
                });
            }
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
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(session_id, {
                relations: ["author", "activities"],
            });
            if (session === undefined || session.author.id !== user.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            /* Does the activity pointed by id belong to session (that we know belongs to user)? */
            const activityRepo = conn.getRepository(Activity);
            const activity = await activityRepo.findOne(activity_id, {
                relations: ["session"],
            });
            if (activity === undefined || activity.session.id !== session.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                    msg: "Activity does not exist",
                });
            /* Update choice repo. I won't add the check that name must be a unique choice,
             * so that the instructor can make say a poll with all options being "Yes".
             * This is peak comedy. */
            const choiceRepo = conn.getRepository(Choice);
            const choice = choiceRepo.create({
                name: name,
                votes: 0,
                activity: activity,
            });
            await choiceRepo.save(choice);
            /* Update activity repo */
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

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async startActivity(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Ctx() { conn, user }: AuthedContext
    ): Promise<ActivityResponse> {
        try {
            /* Does the session pointed by id belong to user? */
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(session_id, {
                relations: ["author", "activities"],
            });
            if (session === undefined || session.author.id !== user.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            /* Does the activity pointed by id belong to session (that we know belongs to user)? */
            const activityRepo = conn.getRepository(Activity);
            const activity = await activityRepo.findOne(activity_id, {
                relations: ["session"],
            });
            if (activity === undefined || activity.session.id !== session.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                    msg: "Activity does not exist",
                });
            /* Update activity repo */
            if (activity.state !== "draft")
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                });
            activity.state = "open";
            await activityRepo.save(activity);
            /* The activity is now started.
             * TODO: How is this event published to the subscribers? */
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
    async closeActivity(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Ctx() { conn, user }: AuthedContext
    ): Promise<ActivityResponse> {
        try {
            /* Does the session pointed by id belong to user? */
            const sessionRepo = conn.getRepository(Session);
            const session = await sessionRepo.findOne(session_id, {
                relations: ["author", "activities"],
            });
            if (session === undefined || session.author.id !== user.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.SESSION_NOT_EXIST,
                    msg: "Session does not exist",
                });
            /* Does the activity pointed by id belong to session (that we know belongs to user)? */
            const activityRepo = conn.getRepository(Activity);
            const activity = await activityRepo.findOne(activity_id, {
                relations: ["session"],
            });
            if (activity === undefined || activity.session.id !== session.id)
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                    msg: "Activity does not exist",
                });
            /* Update activity repo */
            if (activity.state !== "open")
                return ActivityResponse.withErrors({
                    kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                });
            activity.state = "archived";
            await activityRepo.save(activity);
            /* The activity is now closed.
             * TODO: How is this event published to the subscribers? */
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
