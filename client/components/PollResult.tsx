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
        <div className={`${styles.main_container} container_center`}>
            <div className={styles.top_header_container}>
                <div className={styles.header_q_container}>
                    <h2 className={styles.top_header_q}>Q:</h2>
                </div>
                <h3 className={styles.top_header_text}>
                    <b>{title}</b>
                </h3>
            </div>
            <hr id={styles.poll_result_break} />
            <h3>
                <b>{totalVotes}</b> answers
            </h3>
            <div style={{ width: "100%" }}>
                {results.map((result, i) => {
                    const votePercent = Math.round((result.numberOfVotes / totalVotes) * 100) + "%";
                    let shownBarStyle = {
                        width: votePercent,
                        backgroundColor: "",
                    };
                    if (result.numberOfVotes === highestVote) {
                        shownBarStyle.backgroundColor = "var(--c-primary)";
                    }
                    return (
                        <div key={i}>
                            <p className={styles.bar_label}>
                                {result.optionName}, with {result.numberOfVotes} votes
                            </p>
                            <div className={styles.bar_container}>
                                <div className={styles.bar_coloured} style={shownBarStyle} />
                                <span>
                                    {votePercent} ({result.numberOfVotes})
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
