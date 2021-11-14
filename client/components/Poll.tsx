import styles from "../styles/Poll.module.css";
import { useState } from "react";
import { Activity } from "../entities/entities";

export interface PollProps {
    // title: string;
    // // require at least 1 question
    // questions: Array<string>;
    activity: Activity;
}

export default function Poll({ activity }: PollProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitPollAnswer = () => {
        // TODO
    };

    return (
        <div className={styles.container_poll}>
            <form className={`form`}>
                <h2 className={styles.poll_question}>{activity.name}</h2>
                {activity.choices.map((choice, index) => {
                    let classNamePollOption = styles.poll_option;
                    if (index === selectedIndex) {
                        classNamePollOption += " " + styles.poll_option_selected;
                    }
                    return (
                        <div
                            className={classNamePollOption}
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <input
                                type="radio"
                                className={styles.poll_option_radio_input}
                                name="pollRadio"
                                checked={index === selectedIndex}
                                onChange={() => setSelectedIndex(index)}
                            />
                            <span>{choice.name}</span>
                        </div>
                    );
                })}
                <input
                    className="btn btn_call_to_action"
                    type="button"
                    value="Submit"
                    onClick={() => submitPollAnswer()}
                />
            </form>
        </div>
    );
}
