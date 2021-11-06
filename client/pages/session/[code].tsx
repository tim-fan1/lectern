import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import styles from "../../styles/session.module.css";
import { SessionActivity } from "../../util";
import NavigationSession from "../../components/NavigationSession";
import { Activity } from "../../entities/entities";
import { useAppDispatch, useAppSelector } from "../../state/hooks";

function getActivityElement(selection: SessionActivity, activity: Activity) {
    switch (selection) {
        case SessionActivity.POLL:
            return <Poll activity={activity} />;
        default:
            return <p>Coming soon™</p>;
    }
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selectedActivityKind, setSelectedActivityKind] = useState(SessionActivity.POLL);
    const session = useAppSelector((s) => s.session.session);
    const openActivity =
        session !== undefined ? session.activities.find((a) => a.state === "open") : undefined;

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
                        Room:{" "}
                    </span>
                    <span id={styles.room_id_hash} className={styles.room_text}>
                        #
                    </span>
                    <span className={styles.room_text}>{code}</span>
                </div>
            </div>
            <div className={`"container_center" ${styles.content_container}`}>
                {openActivity !== undefined
                    ? getActivityElement(selectedActivityKind, openActivity)
                    : ""}
            </div>
        </div>
    );
}
