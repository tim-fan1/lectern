import {
    Arg,
    ClassType,
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
    ACTIVITY_INVALID_STATE = "ACTIVITY_INVALID_STATE",
    ACTIVITY_NAME_ALREADY_EXIST = "ACTIVITY_NAME_ALREADY_EXIST",
}

export default function createActivityResolver<T extends ClassType>(
    suffix: string,
    objectType: T
) {
    @Resolver({ isAbstract: true })
    abstract class ActivityResolver {
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
        @Query({ name: `get${suffix}Result` })
        async getActivityResult(
            @Arg("session_id") session_id: string,
            @Arg("activity_id") activity_id: string,
            @Ctx() { user, conn }: AuthedContext
        ) {
            // TODO
            // Get result for poll will return each choice and the number of votes for all
            // for quiz will return each choice, number of votes for all, and the correct answer
            // for drag and drop will return each "position" and how many voted a certain choice to be in that position
        }

        @CheckAuth(["sessions"])
        @Mutation(() => ActivityResponse)
        async createActivity(
            @Arg("session_id") session_id: string,
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
                if (
                    session.activities.filter(
                        (activity) => activity.name === name
                    ).length !== 0
                ) {
                    return EndpointResponse.withErrors({
                        kind: ActivityErrors.ACTIVITY_NAME_ALREADY_EXIST,
                        msg: "An activity with the same name already exists",
                    });
                }
                /* Update activity repo. */
                const activityRepo = conn.getRepository(Activity);
                const activity = activityRepo.create({
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

        // TODO: this needs to be implemented and checked before an activity is moved to open
        isValidActivity() {
            // peep what T is and do relevant checks
            return false;
        }
        // do we need to be able to move archived activities back to the draft phase
        resetActivity() {}

        // TODO: stop letting geezers use the name field as the question field
        @CheckAuth(["sessions"])
        @Mutation(() => ActivityResponse)
        async addChoice(
            @Arg("session_id") session_id: string,
            @Arg("activity_id") activity_id: string,
            @Arg("name") name: string,
            @Ctx() { conn, user }: AuthedContext
        ): Promise<ActivityResponse> {
            // TODO: if this is a dnd or a quiz make sure relevant "correct" fields are filled.
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
                if (
                    activity === undefined ||
                    activity.session.id !== session.id
                )
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
                if (
                    activity === undefined ||
                    activity.session.id !== session.id
                )
                    return ActivityResponse.withErrors({
                        kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                        msg: "Activity does not exist",
                    });
                /* Update activity repo */
                if (activity.state !== "draft")
                    return ActivityResponse.withErrors({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                if (!this.isValidActivity()) {
                    return ActivityResponse.withErrors({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });
                }

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
                if (
                    activity === undefined ||
                    activity.session.id !== session.id
                )
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
    return ActivityResolver;
}
