import styles from "../styles/Poll.module.css";

export default function Poll() {
    const questions = [
        "Package managers",
        "JavaScript bundlers",
        "Frameworks on top of frameworks (e.g. Next.js)",
        "All of the above",
    ];
    return (
        <div className={styles.poll_box}>
            <h2 className={styles.poll_question}>
                What is the best web development software for complexity?
            </h2>
            <div className={styles.poll_answer_container}>
                {questions.map((value, index) => {
                    return (
                        <div className={styles.poll_button_container} key={index}>
                            <button className={styles.poll_button_button} />
                            <span>{value}</span>
                        </div>
                    );
                })}
                <div className={styles.poll_answer_space}></div>
            </div>
        </div>
    );
}
