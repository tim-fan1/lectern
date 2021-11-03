import Head from "next/head";
import { useQuery } from "urql";
import ButtonCreate from "../../components/ButtonCreate";
import CardSession from "../../components/CardSession";
import Navigation from "../../components/Navigation";
import styles from "../../styles/dashboard.module.css";
import { sessionStateFromString, SessionStateString } from "../../util";
import { useLecternQuery } from "../../utils/lecternApi";

const QueryGetSessions = `
    query {
        getSessions {
            errors {
                kind,
                msg
            }
            sessions {
                code,
                id,
                name,
                state,
                startTime,
                endTime,
                group
            }
        }
    }
`;

const QueryGroups = `
query {
    getGroups {
        errors {
            kind,
            msg
        }
        groups
    }
}
`;

type Session = {
    code?: string;
    id: number;
    name: string;
    state: SessionStateString;
    startTime?: string;
    endTime?: string;
    group?: string;
};

export default function Dashboard() {
    const {
        data: sessions_data,
        fetching: sessions_fetching,
        errors: session_errors,
    } = useLecternQuery<Session[]>({
        query: QueryGetSessions,
        queryName: "getSessions",
        queryField: "sessions",
    });

    const {
        data: group_data,
        fetching: group_fetching,
        errors: group_errors,
    } = useLecternQuery<string[]>({
        query: QueryGroups,
        queryField: "groups",
        queryName: "getGroups",
    });

    let groups = [] as string[];
    if (!group_fetching) {
        if (group_errors.length !== 0) {
            groups = group_errors.map((error) => error.toString());
        } else {
            groups = group_data!;
        }
    }
    // TODO: error handling, use https://www.npmjs.com/package/next-urql with getServerSideProps

    let sessionsContent =
        sessions_fetching || group_fetching ? (
            <p>Getting your sessions...</p>
        ) : (
            <>
                {
                    /* The list of sessions with a group attached. */
                    groups.map((groupName, i) => {
                        return (
                            <div key={i.toString()}>
                                {/* TODO: probably center this group name lmao. */}
                                <h1>{groupName}</h1>
                                <div id={styles.container_card_session_labels}>
                                    <h3 id={styles.session_label_name}>Name</h3>
                                    <h3 id={styles.session_label_start_time}>Start time</h3>
                                    <h3 id={styles.session_label_end_time}>End time</h3>
                                    <div />
                                </div>
                                {/* Filter sessions so that it on contains sessions for this group. */}
                                {sessions_data!
                                    .filter((session: Session) => session.group === groupName)
                                    .map((session: Session) => (
                                        <CardSession
                                            key={session.id}
                                            code={session.code}
                                            id={session.id}
                                            name={session.name}
                                            state={sessionStateFromString(session.state)}
                                            startTime={session.startTime}
                                            endTime={session.endTime}
                                        />
                                    ))}
                            </div>
                        );
                    })
                }
            </>
        );

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Instructor dashboard</title>
            </Head>
            <Navigation />
            <h1>Instructor dashboard</h1>
            <ButtonCreate href="/instructor/create" text="Create session" />
            <div id={styles.container_sessions} className="container_center">
                <h2>Sessions</h2>
                {sessionsContent}
                {/* The list of sessions with no group attached. */}
                <h1>No group</h1>
                <div id={styles.container_card_session_labels}>
                    <h3 id={styles.session_label_name}>Name</h3>
                    <h3 id={styles.session_label_start_time}>Start time</h3>
                    <h3 id={styles.session_label_end_time}>End time</h3>
                    <div />
                </div>
                {!sessions_fetching &&
                    // console.log(
                    //     sessions_data.getSessions.sessions
                    //         /* Ok, this is actually pain. */
                    //         .filter((session: Session) => session.group === null)
                    // ) &&
                    sessions_data!
                        /* Ok, this is actually pain. */
                        .filter((session: Session) => session.group === null)
                        .map((session: Session) => (
                            <CardSession
                                key={session.id}
                                code={session.code}
                                id={session.id}
                                name={session.name}
                                state={sessionStateFromString(session.state)}
                                startTime={session.startTime}
                                endTime={session.endTime}
                            />
                        ))}
            </div>
        </div>
    );
}
// data.getSessions.sessions
//     .reverse()
//     .map((session: Session) => (
//         <CardSession
//             key={session.id}
//             code={session.code}
//             id={session.id}
//             name={session.name}
//             state={sessionStateFromString(session.state)}
//             startTime={session.startTime}
//             endTime={session.endTime}
//         />
//     ))}
