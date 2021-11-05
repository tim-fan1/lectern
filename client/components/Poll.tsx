import styles from "../styles/Poll.module.css";
import { useState } from "react";
import { Activity } from "../entities/entities";

export interface PollProps {
    title: string;
    // require at least 1 question
    questions: Array<string>;
}

export default function Poll({ questions, title }: PollProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitPollAnswer = () => {
        // TODO
    };
    return (
        <div className={styles.poll_box}>
            <h2 className={styles.poll_question}>{title}</h2>
            <form className={styles.poll_answer_container}>
                {questions.map((value, index) => {
                    let className = styles.poll_button_button;
                    if (index === selectedIndex) {
                        className += " " + styles.poll_button_button_selected;
                    }
                    return (
                        <div
                            className={styles.poll_button_container}
                            key={index}
                            onClick={(e) => setSelectedIndex(index)}
                        >
                            <input
                                type={"radio"}
                                className={className}
                                name={"pollRadio"}
                                checked={index === selectedIndex}
                                onChange={(e) => setSelectedIndex(index)}
                            />
                            <span>{value}</span>
                        </div>
                    );
                })}
                <input
                    className={"btn btn_call_to_action"}
                    type={"button"}
                    value={"Submit"}
                    onClick={(e) => submitPollAnswer()}
                />
                <div className={styles.poll_answer_space} />
            </form>
        </div>
    );
}
