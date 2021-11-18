import { Activity } from "../entities/entities";
import { MarkdownText } from "./MarkdownText";

interface Result {
    optionName: string;
    DnDVotes: number[];
    DnDCorrectPosition: number;
}
interface DragAndDropQuizResults {
    title: string;
    results: Result[];
}
interface DragAndDropQuizResultsProps {
    activity: Activity;
}

export default function DragAndDropQuizResults({ activity }: DragAndDropQuizResultsProps) {
    const results = [] as Result[];
    for (const choice of activity.choices) {
        if (choice.DnDVotes === undefined) continue;
        if (choice.DnDCorrectPosition === undefined) continue;
        results.push({
            optionName: choice.name,
            DnDVotes: choice.DnDVotes,
            DnDCorrectPosition: choice.DnDCorrectPosition,
        });
    }
    results.sort((a, b) => (a.DnDCorrectPosition < b.DnDCorrectPosition ? -1 : 1));
    return (
        <div>
            <div>
                <h2>Q: {activity.name}</h2>
            </div>
            <div>
                <h1>Correct results</h1>
                {results.map((result, i) => {
                    return (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                margin: "1rem 0",
                                backgroundColor: "var(--c-text)",
                                padding: "1.5rem 3rem",
                                color: "black",
                                borderRadius: "2px",
                                border: "var(--c-background-primary) 1px solid",
                            }}
                        >
                            <MarkdownText text={result.optionName} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
