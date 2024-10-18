import type { SetStateAction } from "react";
import { SessionActivity } from "../utils/util";
import styles from "../styles/NavigationSession.module.css";

interface Props {
    selected: SessionActivity;
    setSelected: (value: SetStateAction<SessionActivity>) => void;
}

export default function NavigationSession({ selected, setSelected }: Props) {
    return (
        <div className={styles.selected_button_container}>
            <button
                className={`${
                    selected === SessionActivity.POLL ? styles.selected_selector_button : ""
                }
                        ${styles.selector_button}`}
                onClick={() => setSelected(SessionActivity.POLL)}
            >
                Polls
            </button>
            <button
                className={`${
                    selected === SessionActivity.QA ? styles.selected_selector_button : ""
                }
                        ${styles.selector_button}`}
                onClick={() => setSelected(SessionActivity.QA)}
            >
                Q&A
            </button>
            <button
                className={`${
                    selected === SessionActivity.QUIZ ? styles.selected_selector_button : ""
                }
                        ${styles.selector_button}`}
                onClick={() => setSelected(SessionActivity.QUIZ)}
            >
                Quizzes
            </button>
        </div>
    );
}
