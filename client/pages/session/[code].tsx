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

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session {
                name
                author { name }
                group
                code
            }
            errors {
                kind
                msg
            }
        }
    }
`;

enum TabSelected {
    POLL,
    QA,
    QUIZ,
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selected_ಠ_ಠ, setSelected_ಠ_ಠ] = useState(TabSelected.POLL);

    /* Since this component does represent a possible route in the app, we have to consider that
     * the user has entered an invalid session code by entering it in the URL, even though there
     * are checks on the join form. */
    let codeFormatIsValid = typeof code == "string" && validateSessionCode(code);

    return (
        <div className="container_center">
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
                <Poll />
            </div>
        </div>
    );
}
