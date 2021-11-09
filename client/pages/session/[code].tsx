import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import styles from "../../styles/session.module.css";
import { SessionActivity } from "../../util";
import NavigationSession from "../../components/NavigationSession";
import MultipleChoiceQuiz from "../../components/MultipleChoiceQuiz";
const title = "What is the best web development software for complexity?";

function getActivityElement(activity: SessionActivity) {
    switch (activity) {
        case SessionActivity.POLL:
            return (
                <Poll
                    title={title}
                    questions={[
                        "Package managers",
                        "JavaScript bundlers",
                        "Frameworks on top of frameworks (e.g. Next.js)",
                        "All of the above",
                    ]}
                />
            );
        case SessionActivity.QUIZ:
            return (
                <>
                    <MultipleChoiceQuiz
                        title={"What is the best web development software for complexity?"}
                        /* One of these answers is the correct answer. Of course, the client
                         * won't know which one it is at this point. So really, this is just
                         * the same as <Poll /> */
                        answers={[
                            "Package managers",
                            "JavaScript bundlers",
                            "Frameworks on top of frameworks (e.g. Next.js)",
                            "All of the above",
                        ]}
                    />
                    {/* <DragAndDropQuiz
                        title={title}
                        questions={[
                            "Package managers",
                            "JavaScript bundlers",
                            "Frameworks on top of frameworks (e.g. Next.js)",
                            "All of the above",
                        ]}
                    /> */}
                </>
            );

        default:
            return <p>Coming soon™</p>;
    }
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selectedActivity, setSelectedActivity] = useState(SessionActivity.POLL);

    return (
        <div className={`container_center ${styles.root_container}`}>
            <Head>
                <title>lectern - Session {code}</title>
            </Head>
            <div className={styles.top_container}>
                <LecternLogo />
                <NavigationSession selected={selectedActivity} setSelected={setSelectedActivity} />
                <div id={styles.room_id_container}>
                    <span id={styles.room_id_room} className={styles.room_text}>
                        Room:{" "}
                    </span>
                    <span id={styles.room_id_hash} className={styles.room_text}>
                        #
                    </span>
                    <span className={styles.room_text}>{code}</span>
                </div>
            </div>
            <div className={`"container_center" ${styles.content_container}`}>
                {getActivityElement(selectedActivity)}
            </div>
        </div>
    );
}
