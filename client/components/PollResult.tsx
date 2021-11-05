import styles from "../styles/PollResult.module.css";

interface Result {
    optionName: string;
    numberOfVotes: number;
}
interface PollResultProps {
    title: string;
    results: Result[];
}
export const PollResult = ({ title, results }: PollResultProps) => {
    let totalVotes = results.reduce((a, b) => a + b.numberOfVotes, 0);
    let highestVote = results.reduce((a, b) => Math.max(a, b.numberOfVotes), 0);

    return (
        <div className={styles.main_container}>
            <div className={styles.top_header_container}>
                <div className={styles.header_q_container}>
                    <h2 className={styles.top_header_q}>Q:</h2>
                </div>
                <h3 className={styles.top_header_text}>
                    <b>{title}</b>
                </h3>
            </div>

            {results.map((result, i) => {
                let shownBarStyle = {
                    width: (result.numberOfVotes / totalVotes) * 100 + "%",
                    backgroundColor: "",
                };
                if (result.numberOfVotes === highestVote) {
                    shownBarStyle.backgroundColor = "var(--c-primary)";
                }
                return (
                    <div key={i}>
                        <p>
                            {result.optionName}, with {result.numberOfVotes} votes
                        </p>
                        <div className={styles.tank}>
                            <div className={styles.liquid} style={shownBarStyle} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
