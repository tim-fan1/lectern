import Head from "next/head";
import ButtonCreate from "../../components/ButtonCreate";
import CardSession from "../../components/CardSession";
import Navigation from "../../components/Navigation";
import { Session } from "../../entities/entities";
import styles from "../../styles/dashboard.module.css";
import { sessionStateFromString } from "../../utils/util";
import { useGetSessionsQuery } from "../../utils/lecternApi";

export default function Dashboard() {
    const { getData, fetching, errors } = useGetSessionsQuery();

    let groupedSessionContent, nonGroupedSessionContent, noGroupsCreatedContent;
    if (fetching) {
        groupedSessionContent = <p>Getting your sessions...</p>;
        nonGroupedSessionContent = <></>;
    } else if (errors.length !== 0) {
        groupedSessionContent = <p>An error happened :( {errors.map((e) => e.toString())}</p>;
        nonGroupedSessionContent = <></>;
    } else {
        let sessions = getData();
        // get unique groups
        let groups = sessions
            .map((e) => e.group)
            .filter((group) => group !== null)
            .filter((group, index, array) => array.findIndex((g) => g === group) === index);
        if (sessions.length === 0) {
            noGroupsCreatedContent = <p>There are no sessions yet!</p>;
        } else {
            groupedSessionContent = (
                <>
                    {
                        /* The list of sessions with a group attached. */
                        groups.map((groupName, i) => {
                            return (
                                <div key={i.toString()}>
                                    <h1 className={styles.group_header}>{groupName}</h1>
                                    <div id={styles.container_card_session_labels}>
                                        <h3 id={styles.session_label_name}>Name</h3>
                                        <h3 id={styles.session_label_start_time}>Start time</h3>
                                        <h3 id={styles.session_label_end_time}>End time</h3>
                                        <div />
                                    </div>
                                    {/* Filter sessions so that it on contains sessions for this group. */}
                                    {sessions
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
            nonGroupedSessionContent = (
                <>
                    <h1 className={styles.non_group_header}>No group</h1>
                    <div id={styles.container_card_session_labels}>
                        <h3 id={styles.session_label_name}>Name</h3>
                        <h3 id={styles.session_label_start_time}>Start time</h3>
                        <h3 id={styles.session_label_end_time}>End time</h3>
                        <div />
                    </div>
                    {sessions
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
                </>
            );
        }
    }

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
                {noGroupsCreatedContent}
                {groupedSessionContent}
                {nonGroupedSessionContent}
            </div>
        </div>
    );
}
