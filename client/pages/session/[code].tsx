import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSubscription } from "urql";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import Quiz from "../../components/Quiz";
import QuizResults from "../../components/QuizResults";
import styles from "../../styles/session.module.css";
import { ActivityState, SessionActivity, validateSessionCode } from "../../utils/util";
import NavigationSession from "../../components/NavigationSession";
import Qa from "../../components/Qa";
import QaInput from "../../components/QaInput";
import { Choice, Activity, Session as SessionEntity, QnA } from "../../entities/entities";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import {
    selectSession,
    updateSessionState,
    updateSessionActivities,
    updateSession,
    updateSessionQna,
} from "../../state/sessionSlice";
import { useSessionDetailsQuery } from "../../utils/lecternApi";
import { PollResult } from "../../components/PollResult";
const updatedSession = `
    subscription SessionSub($id: Int!) {
        sessionSubscription(id: $id) {
            session {
                state,
                activities {
                    id,
                    name,
                    state,
                    choices {
                        id,
                        name,
                        PollVotes,
                        DnDVotes,
                        QuizVotes,
                        DnDCorrectPosition,
                        QuizIsCorrect,
                    },
                    kind
                },
                qna {
                    open,
                    questions {
                        id,
                        authorName,
                        question,
                        read,
                        created
                    }
                }
            }
            errors {
                kind
                msg
            }
        }
    }
`;

interface SessionSubQuery {
    sessionSubscription: {
        session: SessionEntity;
        errors: {
            kind: string;
            msg: string;
        }[];
    };
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query as { code?: string };

    const dispatch = useAppDispatch();
    const session = useAppSelector(selectSession);
    const sessionState = useAppSelector((state) => state.session.session?.state);
    const sessionActivities = useAppSelector((state) => state.session.session?.activities);
    const sessionQnA = useAppSelector((state) => state.session.session?.qna);
    const displayName = useAppSelector((state) => state.session.name);

    const [selectedActivityKind, setSelectedActivityKind] = useState(SessionActivity.POLL);
    const openActivity = sessionActivities?.find((activity) => {
        /* Only go through open activities.*/
        if (activity.state !== "open") return false;
        /* POLL matches with POLL, QUIZ matches with QUIZ, etc.*/
        if (activity.kind === selectedActivityKind) return true;
        if (selectedActivityKind === "QUIZ") {
            /* user selected quiz, but activity is not "quiz".
             * check if activity is instead a dnd. if it is we should display it. */
            if (activity.kind === "DND") return true;
        }
        return false;
    });

    let error;
    const handleSessionSub = (
        oldSubQuery = [] as SessionSubQuery[],
        newSubQuery: SessionSubQuery
    ) => {
        if (newSubQuery.sessionSubscription.errors.length !== 0) {
            const errors = newSubQuery.sessionSubscription.errors;
            if (errors.some((e) => e.kind === "SESSION_CLOSED")) {
                error = "The session has now been closed.";
                dispatch(updateSessionState("archived"));
            } else {
                error = "We couldn't connect to the session. Please check the code and try again.";
            }
        } else {
            const updatedSession = newSubQuery.sessionSubscription.session;
            if (updatedSession !== null) {
                /* The subscription only gives us an updated state and activities so we dispatch those individually
                   rather than the whole session so that we don't invalidate other fields. */
                dispatch(updateSessionState(updatedSession.state));
                dispatch(updateSessionActivities(updatedSession.activities));
                dispatch(updateSessionQna(updatedSession.qna));
                // dispatch(updateSession(updatedSession));
            }
        }

        return [newSubQuery];
    };

    /* We have to consider that the user has entered an invalid session code by entering it in the URL,
     * even though there are checks on the join form. */
    const isValidCode = validateSessionCode(code);
    /* In the case session is not in the store, we query it. */
    const sessionDetailsPaused = session !== undefined || !router.isReady;
    const sessionDetailsResult = useSessionDetailsQuery({
        variables: { code: code! },
        pause: sessionDetailsPaused,
    });

    /* Note here that if we do setError then we pause the subscription as there doesn't seem to be a way to
     * cancel it. */
    const [sessionSubResult] = useSubscription(
        {
            query: updatedSession,
            variables: { id: session?.id },
        },
        handleSessionSub
    );

    const [hasVotedPollState, setHasVotedStatePoll] = useState([false, -1] as [boolean, number]);

    const [hasVotedPoll, hasVotedPollId] = hasVotedPollState;
    if (hasVotedPoll) {
        /* find hasVotedPollId in session.activities. */
        const poll = session?.activities.find((a) => a.id === hasVotedPollId && a.kind === "POLL");
        if (poll?.state !== "open") {
            /* This poll has been closed. Reset hasVotedPoll and hasVotedPollid. */
            setHasVotedStatePoll([false, -1]);
        }
    }

    const [hasVotedQuizState, setHasVotedStateQuiz] = useState([false, -1] as [boolean, number]);
    const [hasVotedQuiz, hasVotedQuizId] = hasVotedQuizState;
    if (hasVotedQuiz) {
        const quiz = session?.activities.find(
            (a) => a.id === hasVotedQuizId && (a.kind === "QUIZ" || a.kind === "DND")
        );
        if (quiz?.state !== "open") {
            setHasVotedStateQuiz([false, -1]);
        }
    }
    const getActivityElement = (selection: SessionActivity, activity: Activity | undefined) => {
        /* Handle Q&A as a special case, since it's not an activity */
        if (selection === SessionActivity.QA)
            if (sessionQnA === undefined || !sessionQnA.open)
                return <p>Q&amp;A is not enabled for this session.</p>;
            else
                return (
                    <div>
                        <QaInput sessionId={session?.id ? session?.id : 42069} name={displayName} />
                        <Qa qna={sessionQnA} />
                    </div>
                );

        if (activity === undefined)
            return `A ${
                selection.charAt(0).toUpperCase() + selection.toLowerCase().slice(1)
            } has not been started yet...`;

        switch (selection) {
            case SessionActivity.POLL:
                return !hasVotedPoll ? (
                    <Poll activity={activity} setHasVotedPollState={setHasVotedStatePoll} />
                ) : (
                    <PollResult activity={activity} />
                );
            case SessionActivity.QUIZ:
                return !hasVotedQuiz ? (
                    <Quiz activity={activity} setHasVotedQuizState={setHasVotedStateQuiz} />
                ) : (
                    <QuizResults activity={activity} />
                );
            default:
                return <p>Coming soon™</p>;
        }
    };

    if (!router.isReady) {
        // do nothing for now
    } else if (!isValidCode) {
        error = "Invalid code given";
    } else if (session !== undefined && sessionState !== "open") {
        error = "This session is not open";
    } else if (!sessionDetailsResult.fetching && !sessionDetailsPaused) {
        if (sessionDetailsResult.errors.length === 0) {
            dispatch(updateSession(sessionDetailsResult.getData()));
        } else {
            error = "We couldn't connect to the session. Please check the code and try again.";
        }
    }

    return (
        <div className={`container_center ${styles.root_container}`}>
            <Head>
                <title>lectern - Session {code}</title>
            </Head>
            <div className={styles.top_container}>
                <LecternLogo />
                <NavigationSession
                    selected={selectedActivityKind}
                    setSelected={setSelectedActivityKind}
                />
                <div id={styles.room_id_container}>
                    <span id={styles.room_id_room} className={styles.room_text}>
                        Session:{" "}
                    </span>
                    <span id={styles.room_id_hash} className={styles.room_text}>
                        #
                    </span>
                    <span className={styles.room_text}>{code}</span>
                </div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className={`container_center ${styles.content_container}`}>
                {getActivityElement(selectedActivityKind, openActivity)}
            </div>
        </div>
    );
}
