import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useQuery } from "urql";
import styles from "../../styles/session.module.css";
import { validateSessionCode } from "../../util";
import Image from "next/image";
import favicon from "../../public/favicon.ico";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";

enum TabSelected {
    POLL,
    QA,
    QUIZ,
}

function getActivityElement(activity: TabSelected) {
    switch (activity) {
        case TabSelected.POLL:
            return <Poll />;
        default:
            return <p>Coming soon™</p>;
    }
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selected_ಠ_ಠ, setSelected_ಠ_ಠ] = useState(TabSelected.POLL);

    return (
        <div className={`container_center ${styles.root_container}`}>
            <Head>
                <title>lectern - Session {code}</title>
            </Head>
            <div className={styles.top_container}>
                <LecternLogo />
                <div className={styles.selected_button_container}>
                    <button
                        id="pollsBtn"
                        className={`${
                            selected_ಠ_ಠ === TabSelected.POLL ? styles.selected_selector_button : ""
                        }
                        ${styles.selector_button}`}
                        onClick={(e) => setSelected_ಠ_ಠ(TabSelected.POLL)}
                    >
                        Polls
                    </button>
                    <button
                        id="qaBtn"
                        className={`${
                            selected_ಠ_ಠ === TabSelected.QA ? styles.selected_selector_button : ""
                        }
                        ${styles.selector_button}`}
                        onClick={(e) => setSelected_ಠ_ಠ(TabSelected.QA)}
                    >
                        Q&A
                    </button>
                    <button
                        id="quizBtn"
                        className={`${
                            selected_ಠ_ಠ === TabSelected.QUIZ ? styles.selected_selector_button : ""
                        }
                        ${styles.selector_button}`}
                        onClick={(e) => setSelected_ಠ_ಠ(TabSelected.QUIZ)}
                    >
                        Quizzes
                    </button>
                </div>
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
                {getActivityElement(selected_ಠ_ಠ)}
            </div>
        </div>
    );
}
