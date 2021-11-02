import Head from "next/head";
import Link from "next/link";
import { useQuery } from "urql";
import ButtonCreate from "../../components/ButtonCreate";
import CardSession from "../../components/CardSession";
import Navigation from "../../components/Navigation";
import styles from "../../styles/dashboard.module.css";
import { sessionStateFromString, SessionStateString } from "../../util";

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
    const [sessions_result] = useQuery({ query: QueryGetSessions });
    const {
        data: sessions_data,
        fetching: sessions_fetching,
        error: sessions_error,
    } = sessions_result;

    const [group_result] = useQuery({ query: QueryGroups });
    const { data: group_data, fetching: group_fetching, error: group_error } = group_result;
    let groups = [] as string[];
    if (!group_fetching) {
        if (group_data.getGroups.errors.length !== 0 || group_error) {
            groups = ["error while fetching groups"]; // bodge haha
        } else {
            groups = group_data.getGroups.groups;
            if (groups === null) {
                // theoretically, we should never reach here
                // since the backend never returns a null on non errors
                groups = [];
            }
        }
    }
    // TODO: error handling, use https://www.npmjs.com/package/next-urql with getServerSideProps

    // TODO: below will maybe be applied for when we add groups and properly order the sessions by their details.
    // let content = [<p>Getting your sessions...</p>];
    // if (!fetching) {
    //     const openSessions: JSX.Element[] = [];
    //     const otherSessions: JSX.Element[] = [];
    //     content = [
    //         <h3 className={styles.header_sessions}>Open sessions</h3>,
    //         openSessions,
    //         <h3 className={styles.header_sessions}>Other sessions</h3>,
    //         otherSessions,
    //     ];
    //     data.getSessions.sessions.reverse().map((session: Session) => {
    //         const sessionState = sessionStateFromString(session.state);

    //         const cardSession = (
    //             <CardSession
    //                 key={session.id}
    //                 code={session.code}
    //                 id={session.id}
    //                 name={session.name}
    //                 state={sessionStateFromString(session.state)}
    //                 startTime={session.startTime}
    //                 endTime={session.startTime}
    //             />
    //         );

    //         if (sessionState === SessionState.open) {
    //             openSessions.push(cardSession);
    //         } else {
    //             otherSessions.push(cardSession);
    //         }
    //     });
    // }

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
                {!sessions_fetching &&
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
                                    <div></div>
                                </div>
                                {/* Filter sessions so that it on contains sessions for this group. */}
                                {sessions_data.getSessions.sessions
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
                    })}
                {/* The list of sessions with no group attached. */}
                <h1>No group</h1>
                <div id={styles.container_card_session_labels}>
                    <h3 id={styles.session_label_name}>Name</h3>
                    <h3 id={styles.session_label_start_time}>Start time</h3>
                    <h3 id={styles.session_label_end_time}>End time</h3>
                    <div></div>
                </div>
                {!sessions_fetching &&
                    // console.log(
                    //     sessions_data.getSessions.sessions
                    //         /* Ok, this is actually pain. */
                    //         .filter((session: Session) => session.group === null)
                    // ) &&
                    sessions_data.getSessions.sessions
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
