import { Activity } from "../entities/entities";
import MultipleChoiceQuizResults from "./MultipleChoiceQuizResults";
import DragAndDropQuizResults from "./DragAndDropQuizResults";
export interface QuizResultProps {
    activity: Activity;
}
export default function QuizResult({ activity }: QuizResultProps) {
    return (
        <div style={{ width: "80%", display: "flex", justifyContent: "center" }}>
            {activity.kind === "QUIZ" ? (
                <MultipleChoiceQuizResults activity={activity} />
            ) : (
                <DragAndDropQuizResults activity={activity} />
            )}
        </div>
    );
}
