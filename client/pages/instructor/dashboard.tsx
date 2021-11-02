import Head from "next/head";
import Link from "next/link";
import { useQuery } from "urql";
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
    const [result] = useQuery({ query: QueryGetSessions });
    const { data, fetching, error } = result;

    const [group_result] = useQuery({ query: QueryGroups });
    const { data: group_data, fetching: group_fetching, error: group_error } = group_result;
    let groups = [] as string[];
    if (!group_fetching) {
        if (group_data.getGroups.errors.length !== 0 || error) {
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
            <Link href="/instructor/create">
                <a id={styles.btn_create_session} className="btn btn_primary">
                    <p>Create session</p>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 0 24 24"
                        width="24px"
                        fill="#000000"
                    >
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                </a>
            </Link>
            <div id={styles.container_sessions} className="container_center">
                <h2>Sessions</h2>
                {!fetching &&
                    /* Building the sessions list. */
                    groups.map((groupName, i) => {
                        return (
                            <div key={i.toString()}>
                                <h1>{groupName}</h1>
                                <div id={styles.container_card_session_labels}>
                                    <h3 id={styles.session_label_name}>Name</h3>
                                    <h3 id={styles.session_label_start_time}>Start time</h3>
                                    <h3 id={styles.session_label_end_time}>End time</h3>
                                    <div></div>
                                </div>
                                {/* Filter sessions so that it on contains sessions for this group.
                                 * probably will never FIXME: everything hurts. pain. */}
                                {data.getSessions.sessions
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
