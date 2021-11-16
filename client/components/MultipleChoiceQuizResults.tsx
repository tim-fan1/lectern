interface Result {
    optionName: string;
    numberOfVotes: number;
    isCorrectAnswer: boolean;
}
interface MultipleChoiceQuizResultsProps {
    title: string;
    results: Result[];
}
export default function MultipleChoiceQuizResults({
    title,
    results,
}: MultipleChoiceQuizResultsProps) {
    let totalVotes = results.reduce((acc, item) => acc + item.numberOfVotes, 0);
    return (
        <div>
            <div>
                <h2>Q:</h2>
                <h2>{title}</h2>
            </div>
            <h3>
                <b>{totalVotes}</b> answers
            </h3>
            <div>
                {results.map((result, i) => {
                    const votePercent = Math.round((result.numberOfVotes / totalVotes) * 100) + "%";
                    let shownBarStyle = {
                        height: "50px",
                        width: votePercent,
                        backgroundColor: "",
                    };
                    if (result.isCorrectAnswer) {
                        shownBarStyle.backgroundColor = "var(--c-primary)";
                    } else {
                        shownBarStyle.backgroundColor = "var(--c-text)";
                    }
                    return (
                        <div key={i}>
                            <p>{result.optionName}</p>
                            <div>
                                <div style={shownBarStyle} />
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
}
