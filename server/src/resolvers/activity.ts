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
import { getRepository } from "typeorm";
import { Activity, Session, Choice } from "../entities/entities";
import { EndpointResponse, AuthedContext, left, right } from "../types";
import CheckAuth from "../utils/authMiddleware";
import modifySession, { getSession } from "../utils/modifySession";

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
    KIND_NOT_EXIST = "KIND_NOT_EXIST",
    ACTIVITY_INVALID_STATE = "ACTIVITY_INVALID_STATE",
    ACTIVITY_NAME_ALREADY_EXIST = "ACTIVITY_NAME_ALREADY_EXIST",
}

enum ActivityKinds {
    POLL = "POLL",
    QUIZ = "QUIZ",
    DND = "DND",
}

@Resolver()
export default class ActivityResolver {
    @CheckAuth(["sessions"])
    @Query(() => ActivityArrResponse)
    async getActivities(
        @Arg("sessionId", () => Int) sessionId: number,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityArrResponse> {
        const result = await getSession(openSessions, { id: sessionId }, [
            "author",
        ]);
        if (result.isLeft) return ActivityArrResponse.withErrors(result.data);
        const session = result.data;

        if (session.author.id !== user.id)
            return ActivityArrResponse.withErrors({
                kind: ActivityErrors.ACTIVITY_NOT_EXIST,
            });

        return { errors: [], activities: session.activities };
    }

    @CheckAuth(["sessions"])
    @Query()
    getActivityResult(
        @Arg("session_id") session_id: string,
        @Arg("activity_id") activity_id: string,
        @Ctx() { user, conn }: AuthedContext
    ): number {
        // TODO
        // Get result for poll will return each choice and the number of votes for all
        // for quiz will return each choice, number of votes for all, and the correct answer
        // for drag and drop will return each "position" and how many voted a certain choice to be in that position
        return 0;
    }

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async createActivity(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("name") name: string,
        @Arg("kind") kind: string,
        @Ctx() { conn, user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
        /* Validate kind. */
        kind = kind.trim().toUpperCase();
        if (!(kind in ActivityKinds)) {
            return ActivityResponse.withErrors({
                kind: ActivityErrors.KIND_NOT_EXIST,
                msg: "An activity of that kind can not be created",
            });
        }

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

                /* Does an activity of the same name already exist? */
                if (
                    session.activities.filter((a) => a.name === name).length !==
                    0
                )
                    return left({
                        kind: ActivityErrors.ACTIVITY_NAME_ALREADY_EXIST,
                        msg: "An activity with the same name already exists",
                    });

                session.activities.push(
                    conn.getRepository(Activity).create({
                        kind: kind,
                        name: name,
                        session: session,
                        choices: [],
                    })
                );

                return right(session);
            },
            ["author"],
            true
        );

        if (result.isLeft) return ActivityResponse.withErrors(result.data);
        else
            return {
                errors: [],
                activity: result.data.activities.find((a) => a.name === name),
            };
    }

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async addChoice(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("name") name: string,
        @Ctx() { conn, user, openSessions }: AuthedContext,
        @Arg("QuizIsCorrect", { nullable: true }) QuizIsCorrect?: boolean
    ): Promise<ActivityResponse> {
        // TODO: if this is a dnd or a quiz make sure relevant "correct" fields are filled.
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
                if (thisActivity.state === "archived")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                /* I won't add the check that name must be a unique choice,
                 * so that the instructor can make say a poll with all options
                 * being "Yes". This is peak comedy. */

                if (thisActivity.kind === ActivityKinds.POLL) {
                    thisActivity.choices.push(
                        conn.getRepository(Choice).create({
                            name: name,
                            activity: thisActivity,
                            PollVotes: 0,
                        })
                    );
                } else if (thisActivity.kind === ActivityKinds.QUIZ) {
                    if (QuizIsCorrect === undefined) {
                        QuizIsCorrect = false;
                    }

                    thisActivity.choices.push(
                        conn.getRepository(Choice).create({
                            name: name,
                            activity: thisActivity,
                            QuizVotes: 0,
                            QuizIsCorrect: QuizIsCorrect,
                        })
                    );
                } else if (thisActivity.kind === ActivityKinds.DND) {
                    thisActivity.choices.push(
                        conn.getRepository(Choice).create({
                            name: name,
                            activity: thisActivity,
                            DnDCorrectPosition: thisActivity.choices.length,
                            DnDVotes: [],
                        })
                    );
                }
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
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
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

                if (thisActivity.choices.length === 0) {
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });
                }

                if (thisActivity.kind === ActivityKinds.POLL) {
                    thisActivity.choices.forEach((i) => {
                        if (i.PollVotes === undefined || i.PollVotes === null) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }
                    });
                }

                if (thisActivity.kind === ActivityKinds.QUIZ) {
                    thisActivity.choices.forEach((i) => {
                        if (
                            i.QuizIsCorrect === undefined ||
                            i.QuizIsCorrect === null
                        ) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }

                        if (i.QuizVotes === undefined || i.QuizVotes === null) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }
                    });
                }

                if (thisActivity.kind === ActivityKinds.DND) {
                    thisActivity.choices.forEach((i) => {
                        thisActivity.choices.forEach(() => {
                            if (
                                i.DnDVotes === undefined ||
                                i.DnDVotes === null
                            ) {
                                return left({
                                    kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                                });
                            }

                            if (
                                i.DnDCorrectPosition === undefined ||
                                i.DnDCorrectPosition === null
                            ) {
                                return left({
                                    kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                                });
                            }

                            i.DnDVotes.push(0);
                        });
                    });
                }

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
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
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

    @CheckAuth(["sessions"])
    @Mutation(() => ActivityResponse)
    async resetActivity(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResponse> {
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
                if (thisActivity.state !== "archived")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                if (thisActivity.choices.length === 0) {
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });
                }

                if (thisActivity.kind === ActivityKinds.POLL) {
                    thisActivity.choices.forEach((i) => {
                        if (i.PollVotes === undefined || i.PollVotes === null) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }
                        i.PollVotes = 0;
                    });
                }

                if (thisActivity.kind === ActivityKinds.QUIZ) {
                    thisActivity.choices.forEach((i) => {
                        if (
                            i.QuizIsCorrect === undefined ||
                            i.QuizIsCorrect === null
                        ) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }

                        if (i.QuizVotes === undefined || i.QuizVotes === null) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }

                        i.QuizVotes = 0;
                    });
                }

                if (thisActivity.kind === ActivityKinds.DND) {
                    thisActivity.choices.forEach((i) => {
                        if (i.DnDVotes === undefined || i.DnDVotes === null) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }

                        if (
                            i.DnDCorrectPosition === undefined ||
                            i.DnDCorrectPosition === null
                        ) {
                            return left({
                                kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            });
                        }

                        i.DnDVotes.forEach((j) => {
                            j = 0;
                        });
                    });
                }

                thisActivity.state = "draft";

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
