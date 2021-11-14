import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import ButtonCreate from "../../../components/ButtonCreate";
import CardActivity from "../../../components/CardActivity";
import Navigation from "../../../components/Navigation";
import NavigationSession from "../../../components/NavigationSession";
import { Activity } from "../../../entities/entities";
import styles from "../../../styles/manage.module.css";
import { activityStateFromString, SessionActivity } from "../../../utils/util";

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
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
                  kind
                }
            }
            errors {
                kind
                msg
            }
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

export default function DashboardSession() {
    const router = useRouter();
    const code = router.query.code;

    const [closeSessionResult, closeSession] = useMutation(MutationCloseSession);
    const handleCloseSession = (id: number) => {
        closeSession({ id }).then((result) => {
            if (result.data.closeSession.errors.length === 0) {
                router.push("/instructor/dashboard");
                // setError("");
            } else {
                // setError(`Could not close session "${name}". Please try again.`);
            }
        });
    };

    const [selectedActivity, setSelectedActivity] = useState(SessionActivity.POLL);

    const getActivityButtonCreate = () => {
        switch (selectedActivity) {
            case SessionActivity.POLL:
                return <ButtonCreate href={`/instructor/${code}/create/poll`} text="Create poll" />;
            case SessionActivity.QA:
                return <ButtonCreate href={`/instructor/${code}/create/qa`} text="Create Q&A" />;
            case SessionActivity.QUIZ:
                return <ButtonCreate href={`/instructor/${code}/create/qa`} text="Create quiz" />;
        }
    };

    const [result] = useQuery({
        query: QuerySessionDetails,
        variables: { code: router.query.code },
    });

    let { data, fetching } = result;
    let content;
    let session: QueriedSession;
    if (fetching) {
        content = <p>I&apos;m loading</p>;
    } else if (data.sessionDetails.errors.length !== 0) {
        // error happened - maybe no auth?
        console.log("error?", data.sessionDetails);
        content = <p>An error happened! {data.sessionDetails.errors.toString()}</p>;
    } else {
        session = data.sessionDetails.session;

        let activities = data.sessionDetails.session.activities
            .filter(
                (activity: Activity) => activity.kind === SessionActivity.toString(selectedActivity)
            )
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
                {getActivityButtonCreate()}
                {activities}
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
