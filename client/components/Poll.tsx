import styles from "../styles/Poll.module.css";
import { useState } from "react";
import { Activity } from "../entities/entities";

interface Props {
    activity: Activity;
}

export default function Poll({ activity }: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <div className={styles.poll_box}>
            <h2 className={styles.poll_question}>{activity.name}</h2>
            <div className={styles.poll_answer_container}>
                {activity.choices.map((choice, index) => {
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
                            <button className={className} />
                            <span>{choice.name}</span>
                        </div>
                    );
                })}
                <div className={styles.poll_answer_space} />
            </div>
        </div>
    );
}
