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
import { Activity, Session, Choice } from "../entities/entities";
import { EndpointResponse, AuthedContext, left, right } from "../types";
import CheckAuth from "../utils/authMiddleware";
import modifySession from "../utils/modifySession";

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
                    .length !== 0
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
        @Ctx() { conn, user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
        // TODO declare int type in arg, fix up frontend
        const sessionId = parseInt(session_id, 10);
        const activityId = parseInt(activity_id, 10);
        const result = await modifySession(
            openSessions,
            { id: sessionId },
            (session) => {
                /* Does the session pointed by id belong to user? */
                if (session.author.id !== user.id)
                    return left({
                        kind: ActivityErrors.SESSION_NOT_EXIST,
                        msg: "Session does not exist",
                    });

                /* Is there an activity with this id in the session? */
                const thisActivity = session.activities.find(
                    (a) => a.id === activityId
                );
                if (thisActivity === undefined)
                    return left({
                        kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                        msg: "Activity does not exist",
                    });

                /* Is the activity not yet archived? */
                if (thisActivity.state !== "archived")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                /* I won't add the check that name must be a unique choice,
                 * so that the instructor can make say a poll with all options
                 * being "Yes". This is peak comedy. */
                thisActivity.choices.push(
                    conn
                        .getRepository(Choice)
                        .create({ name: name, activity: thisActivity })
                );

                return right(session);
            },
            ["author"],
            true // set saveNow so the choice gets an ID generated
        );

        if (result.isLeft) return ActivityResponse.withErrors(result.data);
        else
            return {
                errors: [],
                activity: result.data.activities.find(
                    (a) => a.id === activityId
                ),
            };
    }

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async startActivity(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
        // TODO declare int type in arg, fix up frontend
        const sessionId = parseInt(session_id, 10);
        const activityId = parseInt(activity_id, 10);
        const result = await modifySession(
            openSessions,
            { id: sessionId },
            (session) => {
                /* Does the session pointed by id belong to user? */
                if (session.author.id !== user.id)
                    return left({
                        kind: ActivityErrors.SESSION_NOT_EXIST,
                        msg: "Session does not exist",
                    });

                /* Is there an activity with this id in the session? */
                const thisActivity = session.activities.find(
                    (a) => a.id === activityId
                );
                if (thisActivity === undefined)
                    return left({
                        kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                        msg: "Activity does not exist",
                    });

                /* Is the activity in draft? */
                if (thisActivity.state !== "draft")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                thisActivity.state = "open";
                return right(session);
            },
            ["author"]
        );

        if (result.isLeft) return ActivityResponse.withErrors(result.data);
        else
            return {
                errors: [],
                activity: result.data.activities.find(
                    (a) => a.id === activityId
                ),
            };
    }

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async closeActivity(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
        // TODO declare int type in arg, fix up frontend
        const sessionId = parseInt(session_id, 10);
        const activityId = parseInt(activity_id, 10);
        const result = await modifySession(
            openSessions,
            { id: sessionId },
            (session) => {
                /* Does the session pointed by id belong to user? */
                if (session.author.id !== user.id)
                    return left({
                        kind: ActivityErrors.SESSION_NOT_EXIST,
                        msg: "Session does not exist",
                    });

                /* Is there an activity with this id in the session? */
                const thisActivity = session.activities.find(
                    (a) => a.id === activityId
                );
                if (thisActivity === undefined)
                    return left({
                        kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                        msg: "Activity does not exist",
                    });

                /* Is the activity currently open? */
                if (thisActivity.state !== "open")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                thisActivity.state = "archived";
                return right(session);
            },
            ["author"]
        );

        if (result.isLeft) return ActivityResponse.withErrors(result.data);
        else
            return {
                errors: [],
                activity: result.data.activities.find(
                    (a) => a.id === activityId
                ),
            };
    }
}
