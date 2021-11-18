import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, MouseEvent, ChangeEvent } from "react";
import { useMutation, useQuery, useSubscription } from "urql";
import ButtonCreate from "../../../components/ButtonCreate";
import CardActivity from "../../../components/CardActivity";
import Navigation from "../../../components/Navigation";
import NavigationSession from "../../../components/NavigationSession";
import { Activity, Session } from "../../../entities/entities";
import styles from "../../../styles/manage.module.css";
import { activityStateFromString, SessionActivity } from "../../../utils/util";
import Qa from "../../../components/Qa";
import { useAppDispatch, useAppSelector } from "../../../state/hooks";
import {
    selectSession,
    updateSession,
    updateSessionQna,
    updateSessionState,
} from "../../../state/sessionSlice";
import { PollResult } from "../../../components/PollResult";

const SessionFields = `
    session {
        id,
        created,
        updated,
        state,
        startTime,
        endTime,
        group,
        name,
        code,
        activities {
            id,
            name,
            state,
            kind,
            choices {
                name,
                DnDCorrectPosition,
                DnDVotes,
                PollVotes,
                QuizIsCorrect,
                QuizVotes
            }
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
`;

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            ${SessionFields}
            errors {
                kind
                msg
            }
        }
    }
`;

const SubscriptionSession = `
    subscription ($id: Int!) {
        sessionSubscription(id: $id) {
            ${SessionFields}
        }
    }
`;

const MutationCloseSession = `
    mutation ($id: Int!) {
        closeSession(id: $id) {
            errors {
                kind
                msg
            }
        }
    }
`;

const MutationQnaState = `
    mutation ($id: Int!, $open: Boolean!) {
        toggleQnA(id: $id, open: $open) {
            errors { kind, msg }
        }
    }
`;

interface QueriedSession {
    id: number;
    created: Date;
    updated: Date;
    state: String;
    startTime?: Date;
    endTime?: Date;
    group: String;
    name: String;
    code?: String;
}

interface SessionSubQuery {
    sessionSubscription: {
        session: Session;
        errors: {
            kind: string;
            msg: string;
        }[];
    };
}

export default function DashboardSession() {
    const router = useRouter();
    const code = router.query.code;

    const [closeSessionResult, closeSession] = useMutation(MutationCloseSession);
    const handleCloseSession = (id: number) => {
        closeSession({ id }).then((result) => {
            if (result.data.closeSession.errors.length === 0) {
                router.push("/instructor/dashboard");
            }
        });
    };

    const [toggleQnaResult, toggleQna] = useMutation(MutationQnaState);
    const [toggleQnaEnabled, setToggleQnaEnabled] = useState(true);
    const handleToggleQna = (event: ChangeEvent<HTMLInputElement>) => {
        setToggleQnaEnabled(false);
        toggleQna({ id: session?.id, open: event.target.checked }).then(() =>
            setToggleQnaEnabled(true)
        );
    };

    const [selectedActivity, setSelectedActivity] = useState(SessionActivity.POLL);

    const dispatch = useAppDispatch();
    const session = useAppSelector(selectSession);
    let errors = [];

    const [initialFetched, setInitialFetched] = useState(false);

    const [result] = useQuery({
        query: QuerySessionDetails,
        variables: { code: router.query.code },
    });

    /* Dispatch the session (update it in Redux store) when the sessionDetails
     * query comes back */
    const { data, fetching } = result;
    if (!fetching && !initialFetched) {
        if (data.sessionDetails.errors.length === 0) {
            dispatch(updateSession(data.sessionDetails.session));
            setInitialFetched(true);
        } else errors = data.sessionDetails.errors;
    }

    /* Set up the subscription using the ID from the query, to dispatch the
     * entire session every time we receive new data. */
    useSubscription(
        { query: SubscriptionSession, variables: { id: session?.id } },
        (_, newSubQuery: SessionSubQuery) => {
            const updatedSession = newSubQuery.sessionSubscription.session;
            if (updatedSession !== null) {
                dispatch(updateSession(updatedSession));
            }

            return newSubQuery;
        }
    );

    const getActivityButtonCreate = (session: Session) => {
        switch (selectedActivity) {
            case SessionActivity.POLL:
                return <ButtonCreate href={`/instructor/${code}/create/poll`} text="Create poll" />;
            case SessionActivity.QA:
                return (
                    <div
                        className={
                            styles.qna_toggle_container +
                            " " +
                            (toggleQnaEnabled ? "" : styles.disabled)
                        }
                    >
                        <label htmlFor="openQna">Enable Q&amp;A</label>
                        <input
                            id="openQna"
                            type="checkbox"
                            defaultChecked={session.qna.open}
                            disabled={!toggleQnaEnabled}
                            onChange={handleToggleQna}
                        />
                    </div>
                );
            case SessionActivity.QUIZ:
                return (
                    <div style={{ display: "flex", flexDirection: "row", gap: "30px" }}>
                        <ButtonCreate
                            href={`/instructor/${code}/create/quiz/multiplechoice`}
                            text="Create a multiple choice quiz"
                        />
                        <ButtonCreate
                            href={`/instructor/${code}/create/quiz/draganddrop`}
                            text="Create a drag and drop quiz"
                        />
                    </div>
                );
        }
    };

    /* Returns the current activity for a particular kind, if there is one open */
    const getCurrentActivityElem = (session: Session, kind: SessionActivity) => {
        switch (kind) {
            case SessionActivity.QA:
                return <Qa qna={session.qna} />;
            case SessionActivity.POLL:
                const currentPoll = session.activities.find(
                    (a) => a.kind === SessionActivity.POLL && a.state === "open"
                );
                if (currentPoll === undefined) return <></>;
                return <PollResult activity={currentPoll} />;
        }
    };

    let content;

    if (!session) {
        content = <p>I&apos;m loading</p>;
    } else if (errors.length !== 0) {
        // error happened - maybe no auth?
        content = <p>An error happened! {errors.toString()}</p>;
    } else {
        let activities: React.ReactNode[];

        if (SessionActivity.toString(selectedActivity) !== "QA") {
            activities = session.activities
                .filter((activity: Activity) => {
                    /* POLL matches with POLL, QUIZ matches with QUIZ, etc.*/
                    if (activity.kind === SessionActivity.toString(selectedActivity)) return true;
                    if (SessionActivity.toString(selectedActivity) === "QUIZ") {
                        /* user selected quiz, but activity is not "quiz".
                         * check if activity is instead a dnd. if it is we should display it. */
                        if (activity.kind === "DND") return true;
                    }
                    return false;
                })
                .sort((a, b) => activityStateToNum(a.state) - activityStateToNum(b.state))
                .map((activity: Activity) => {
                    return (
                        <CardActivity
                            key={activity.id}
                            id={activity.id}
                            sessionId={session.id}
                            name={activity.name}
                            state={activityStateFromString(activity.state)}
                        />
                    );
                });
        } else {
            // Q&A
            activities = [<p key={0}>Put the activity here</p>];
        }

        content = (
            <>
                <Link href="/instructor/dashboard">
                    <a>&lt;- Back to sessions dashboard</a>
                </Link>
                <div className="container_center">
                    <h1>{session.name}</h1>
                    <h2>
                        Session code: <b>#{code}</b>
                    </h2>
                </div>
                <div className="form_container_btn">
                    <button
                        onClick={() => handleCloseSession(session.id)}
                        className="btn btn_secondary"
                    >
                        Close session
                    </button>
                    <Link href={`/instructor/${code}/present`} passHref>
                        <button className="btn btn_secondary">Present session</button>
                    </Link>
                </div>
                <div id={styles.session_nav}>
                    <NavigationSession
                        selected={selectedActivity}
                        setSelected={setSelectedActivity}
                    />
                </div>
                <div id={styles.activity_display}>
                    {getActivityButtonCreate(session)}
                    {getCurrentActivityElem(session, selectedActivity)}
                    {selectedActivity !== "QA" && (
                        <div id={styles.container_activities}>{activities}</div>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Session #{code}</title>
            </Head>
            <Navigation />
            <div className="container_center">{content}</div>
        </div>
    );
}

function activityStateToNum(state: string) {
    switch (state) {
        case "open":
            return 0;
        case "draft":
            return 1;
        case "archived":
            return 2;
        default:
            return 3;
    }
}
