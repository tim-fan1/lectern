import { tr } from "date-fns/locale";
import {
    Arg,
    ClassType,
    createUnionType,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { DeepPartial, getRepository } from "typeorm";
import { InputChoice } from "../entities/Choice";
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

@ObjectType()
class ChoiceVote {
    @Field()
    choice!: string;
    @Field(() => Int)
    votes!: number;
}

@ObjectType()
class PollResult {
    @Field()
    kind!: string;
    @Field(() => [ChoiceVote])
    result!: ChoiceVote[];
}

@ObjectType()
class QuizResult {
    @Field()
    kind!: string;
    @Field(() => [ChoiceVote])
    result!: ChoiceVote[];
    @Field(() => [String])
    correctChoices!: string[];
}

@ObjectType()
class PosVote {
    @Field()
    position!: number;
    @Field(() => [ChoiceVote])
    posVotes!: ChoiceVote[];
    @Field()
    correctChoice!: string;
}
@ObjectType()
class DnDResult {
    @Field()
    kind!: string;
    @Field(() => [PosVote])
    result!: PosVote[];
}

const ActivityResultUnion = createUnionType({
    name: "ActivityResult",
    types: () => [PollResult, QuizResult, DnDResult],
});

@ObjectType()
class ActivityResultResponse extends EndpointResponse {
    @Field(() => ActivityResultUnion, { nullable: true })
    result?: PollResult | QuizResult | DnDResult;
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

export enum ActivityKinds {
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
    @Query(() => ActivityResultResponse)
    async getActivityResult(
        @Arg("session_id", () => Int) sessionId: number,
        @Arg("activity_id", () => Int) activity_id: number,
        @Ctx() { user, openSessions }: AuthedContext
    ): Promise<ActivityResultResponse> {
        const result = await getSession(openSessions, { id: sessionId });
        if (result.isLeft)
            return ActivityResultResponse.withErrors(result.data);
        const session = result.data;

        const activity = session.activities.find((i) => {
            return i.id === activity_id;
        });

        if (!activity) {
            return {
                errors: [
                    {
                        kind: ActivityErrors.ACTIVITY_NOT_EXIST,
                        msg: "Activity does not exist",
                    },
                ],
            };
        }

        if (activity.state !== "archived") {
            return {
                errors: [
                    {
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                        msg: "Activity must be archived before you can get the result",
                    },
                ],
            };
        }

        //todo check if activity is archived

        if (activity.kind === ActivityKinds.POLL) {
            let activityResult: PollResult = new PollResult();
            activityResult.kind = ActivityKinds.POLL;
            activityResult.result = [];

            activity.choices.forEach((i) => {
                if (i.PollVotes === undefined) {
                    activityResult.result.push({
                        choice: i.name,
                        votes: 0,
                    });
                } else {
                    activityResult.result.push({
                        choice: i.name,
                        votes: i.PollVotes,
                    });
                }
            });
            return { errors: [], result: activityResult };
        }

        if (activity.kind === ActivityKinds.QUIZ) {
            let activityResult: QuizResult = new QuizResult();
            activityResult.kind = ActivityKinds.QUIZ;
            activityResult.result = [];
            activityResult.correctChoices = [];

            activity.choices.forEach((i) => {
                if (i.QuizVotes === undefined) {
                    activityResult.result.push({
                        choice: i.name,
                        votes: 0,
                    });
                } else {
                    activityResult.result.push({
                        choice: i.name,
                        votes: i.QuizVotes,
                    });
                }
                if (i.QuizIsCorrect) {
                    activityResult.correctChoices.push(i.name);
                }
            });
            return { errors: [], result: activityResult };
        }

        if (activity.kind === ActivityKinds.DND) {
            let activityResult: DnDResult = new DnDResult();
            activityResult.kind = ActivityKinds.DND;
            activityResult.result = [];

            activity.choices.forEach((i) => {
                if (i.DnDCorrectPosition !== undefined) {
                    activityResult.result.push({
                        position: i.DnDCorrectPosition,
                        posVotes: [],
                        correctChoice: i.name,
                    });
                }
            });

            activity.choices.forEach((i) => {
                if (i.DnDVotes) {
                    for (let j = 0; j < i.DnDVotes?.length; j++) {
                        activityResult.result[j].posVotes.push({
                            votes: i.DnDVotes[j],
                            choice: i.name,
                        });
                    }
                }
            });

            return { errors: [], result: activityResult };
        }

        return { errors: [], result: undefined };
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
    async addChoices(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("choices", () => [InputChoice]) choices: InputChoice[],
        // @Arg("name") name: string,
        // @Arg("QuizIsCorrect", { nullable: true }) QuizIsCorrect?: boolean
        @Ctx() { conn, user, openSessions }: AuthedContext
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

                /* Is the activity not yet archived? */
                if (thisActivity.state === "archived")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                /* I won't add the check that name must be a unique choice,
                 * so that the instructor can make say a poll with all options
                 * being "Yes". This is peak comedy. */

                for (let thisChoice of choices) {
                    let thisPartial: DeepPartial<Choice>;

                    // haha type safety
                    switch (thisActivity.kind as ActivityKinds) {
                        case ActivityKinds.POLL:
                            thisPartial = {
                                PollVotes: 0,
                            };
                            break;
                        case ActivityKinds.QUIZ:
                            thisPartial = {
                                QuizVotes: 0,
                                QuizIsCorrect:
                                    thisChoice.QuizIsCorrect === undefined
                                        ? false
                                        : thisChoice.QuizIsCorrect,
                            };
                            break;
                        case ActivityKinds.DND:
                            thisPartial = {
                                DnDCorrectPosition: thisActivity.choices.length,
                                DnDVotes: [],
                            };
                            break;
                    }
                    thisPartial.name = thisChoice.name;
                    thisPartial.activity = thisActivity;

                    const newChoice = conn
                        .getRepository(Choice)
                        .create(thisPartial);
                    thisActivity.choices.push(newChoice);
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
    async editChoice(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("choiceId", () => Int) choiceId: number,
        @Ctx() { conn, user, openSessions }: AuthedContext,
        @Arg("name", { nullable: true }) name?: string,
        @Arg("DnDCorrectPosition", () => Int, { nullable: true })
        DnDCorrectPosition?: number,
        @Arg("QuizIsCorrect", { nullable: true }) QuizIsCorrect?: boolean
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

                const thisChoice = thisActivity.choices.find(
                    (i) => i.id === choiceId
                );
                if (thisChoice === undefined)
                    return left({
                        kind: "CHOICE_DOES_NOT_EXIST",
                        msg: "Activity does not exist",
                    });

                /* Is the activity not yet archived? */
                if (thisActivity.state !== "draft")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                if (thisActivity.kind === ActivityKinds.POLL) {
                    if (name === undefined) {
                        return left({
                            kind: "INVALID_REQUEST",
                            msg: "Did not provide name",
                        });
                    } else {
                        thisChoice.name = name;
                    }
                } else if (thisActivity.kind === ActivityKinds.QUIZ) {
                    if (QuizIsCorrect === undefined && name === undefined) {
                        return left({
                            kind: "INVALID_REQUEST",
                            msg: "Did not provide QuizIsCorrect or name",
                        });
                    }

                    if (QuizIsCorrect !== undefined) {
                        thisChoice.QuizIsCorrect = QuizIsCorrect;
                    }

                    if (name !== undefined) {
                        thisChoice.name = name;
                    }
                } else if (thisActivity.kind === ActivityKinds.DND) {
                    if (
                        DnDCorrectPosition === undefined &&
                        name === undefined
                    ) {
                        return left({
                            kind: "INVALID_REQUEST",
                            msg: "Did not provide DnDCorrectPosition or name",
                        });
                    }

                    if (name !== undefined) {
                        thisChoice.name = name;
                    }

                    if (
                        name === undefined &&
                        DnDCorrectPosition !== undefined
                    ) {
                        if (
                            DnDCorrectPosition >= thisActivity.choices.length ||
                            DnDCorrectPosition < 0
                        ) {
                            return left({
                                kind: "INVALID_REQUEST",
                                msg: "DnDCorrectPosition too big or too small",
                            });
                        }
                    }

                    if (DnDCorrectPosition !== undefined) {
                        thisChoice.DnDCorrectPosition = DnDCorrectPosition;
                    }
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
    async removeChoice(
        @Arg("sessionId", () => Int) sessionId: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("choiceId", () => Int) choiceId: number,
        @Ctx() { conn, user, openSessions }: AuthedContext
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

                /* Is the activity not yet archived? */
                if (thisActivity.state !== "draft")
                    return left({
                        kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                    });

                thisActivity.choices = thisActivity.choices.filter((i) => {
                    return i.id !== choiceId;
                });

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
                    let hasAnAnswer: boolean = false;
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

                        if (i.QuizIsCorrect === true) {
                            hasAnAnswer = true;
                        }
                    });

                    if (!hasAnAnswer) {
                        return left({
                            kind: ActivityErrors.ACTIVITY_INVALID_STATE,
                            msg: "Your quiz has no correct answer",
                        });
                    }
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

                /* Is the activity archived? */
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

                        i.DnDVotes = [];
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
