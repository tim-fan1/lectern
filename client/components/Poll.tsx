import styles from "../styles/Poll.module.css";
import { useState } from "react";

export default function Poll() {
    const questions = [
        "Package managers",
        "JavaScript bundlers",
        "Frameworks on top of frameworks (e.g. Next.js)",
        "All of the above",
    ];
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <div className={styles.poll_box}>
            <h2 className={styles.poll_question}>
                What is the best web development software for complexity?
            </h2>
            <div className={styles.poll_answer_container}>
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
                            <button className={className} />
                            <span>{value}</span>
                        </div>
                    );
                })}
                <div className={styles.poll_answer_space} />
            </div>
        </div>
    );
}
