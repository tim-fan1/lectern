import { Activity } from "../entities/entities";
import styles from "../styles/PollResult.module.css";
import { MarkdownText } from "./MarkdownText";

interface Result {
    optionName: string;
    numberOfVotes: number;
}
interface PollResultProps {
    activity: Activity;
}
export const PollResult = ({ activity }: PollResultProps) => {
    const results = [] as Result[];
    for (const choice of activity.choices) {
        if (choice.PollVotes === undefined) continue;
        results.push({
            optionName: choice.name,
            numberOfVotes: choice.PollVotes,
        });
    }
    let totalVotes = results.reduce((a, b) => a + b.numberOfVotes, 0);
    let highestVote = results.reduce((a, b) => Math.max(a, b.numberOfVotes), 0);
    return (
        <div className={`${styles.main_container} container_center`}>
            <div className={styles.top_header_container}>
                <h2 className={styles.top_header_q}>Q:</h2>
                <MarkdownText className={styles.top_header_text} text={activity.name} />
            </div>
            <hr id={styles.poll_result_break} />
            <h3 className={styles.vote_count}>
                <b>{totalVotes}</b> answers
            </h3>
            <div className={styles.all_bars_container}>
                {results.map((result, i) => {
                    const votePercent =
                        (totalVotes === 0
                            ? 0
                            : Math.round((result.numberOfVotes / totalVotes) * 100)) + "%";
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
                            <MarkdownText className={styles.bar_label} text={result.optionName} />
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
