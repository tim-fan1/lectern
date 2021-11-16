import { useState } from "react";
import styles from "../styles/Poll.module.css";
export interface MultipleChoiceProps {
    title: string;
    answers: Array<string>;
}
export default function MultipleChoiceQuiz({ title, answers }: MultipleChoiceProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitSelectedAnswer = () => {
        // TODO:
    };
    return (
        <div className={styles.poll_box}>
            <h2 className={styles.poll_question}>{title}</h2>
            <form className={styles.poll_answer_container}>
                {answers.map((answer, index) => {
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
                                name={"pollRadio" + answer}
                                checked={index === selectedIndex}
                                onChange={(e) => setSelectedIndex(index)}
                            />
                            <span>{answer}</span>
                        </div>
                    );
                })}
                <input
                    className={"btn btn_call_to_action"}
                    type={"button"}
                    value={"Submit"}
                    onClick={(e) => submitSelectedAnswer()}
                />
                <div className={styles.poll_answer_space} />
            </form>
        </div>
    );
}
