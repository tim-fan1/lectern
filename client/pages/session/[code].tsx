import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSubscription } from "urql";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import MultipleChoiceQuiz from "../../components/MultipleChoiceQuiz";
import DragAndDropQuiz from "../../components/DragAndDropQuiz";
import styles from "../../styles/session.module.css";
import { SessionActivity, validateSessionCode } from "../../utils/util";
import NavigationSession from "../../components/NavigationSession";
import Qa from "../../components/Qa";
import QaInput from "../../components/QaInput";
import { Choice, Activity, Session as SessionEntity, QnA } from "../../entities/entities";
import MultipleChoiceQuizResults from "../../components/MultipleChoiceQuizResults";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import {
    selectSession,
    updateSessionState,
    updateSessionActivities,
    updateSession,
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
                        read
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

    const [selectedActivityKind, setSelectedActivityKind] = useState(SessionActivity.POLL);
    const openActivity = sessionActivities?.find(
        (a) => a.state === "open" && a.kind === selectedActivityKind
    );

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
            // TODO: the backend returns null if we add a poll so we check that here so we don't end up accessing
            // null state
            if (updatedSession !== null) {
                /* The subscription only gives us an updated state and activities so we dispatch those individually
                   rather than the whole session so that we don't invalidate other fields. */
                dispatch(updateSessionState(updatedSession.state));
                dispatch(updateSessionActivities(updatedSession.activities));
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
    const getActivityElement = (selection: SessionActivity, activity: Activity | undefined) => {
        /* Handle Q&A as a special case, since it's not an activity */
        if (selection === SessionActivity.QA)
            if (sessionQnA === undefined || !sessionQnA.open)
                return <p>This session does not have a Q&amp;A</p>;
            else
                return (
                    <div>
                        <QaInput name="Anonymous" />
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
                    // <h1>About to list results of poll id {hasVotedPollId}</h1>
                    <PollResult activity={activity} />
                );
            case SessionActivity.QUIZ:
                return <MultipleChoiceQuiz activity={activity} />;
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
                    {/* nocheckin: does this need to be here? */}
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
