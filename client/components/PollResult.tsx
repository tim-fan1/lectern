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
                <h2 className={styles.top_header_q}>Q:</h2>
                <h2 className={styles.top_header_text}>{title}</h2>
            </div>
            <hr id={styles.poll_result_break} />
            <h3 className={styles.vote_count}>
                <b>{totalVotes}</b> answers
            </h3>
            <div className={styles.all_bars_container}>
                {results.map((result, i) => {
                    const votePercent = Math.round((result.numberOfVotes / totalVotes) * 100) + "%";
                    let votePercentStyle = "";
                    let shownBarStyle = {
                        width: votePercent,
                        backgroundColor: "",
                    };
                    if (result.numberOfVotes === highestVote) {
                        shownBarStyle.backgroundColor = "var(--c-primary)";
                        votePercentStyle = styles.vote_highest_label;
                    }

                    return (
                        <div key={i}>
                            <p className={styles.bar_label}>{result.optionName}</p>
                            <div className={styles.bar_container}>
                                <div className={styles.bar_coloured} style={shownBarStyle} />
                                <span className={votePercentStyle}>
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
