import { Activity } from "../entities/entities";
import DragAndDropQuiz from "./DragAndDropQuiz";
import MultipleChoiceQuiz from "./MultipleChoiceQuiz";
export interface QuizProps {
    activity: Activity;
    setHasVotedQuizState: Function;
}
export default function Quiz({ activity, setHasVotedQuizState }: QuizProps) {
    return (
        <div>
            {activity.kind === "QUIZ" ? (
                <MultipleChoiceQuiz
                    activity={activity}
                    setHasVotedQuizState={setHasVotedQuizState}
                />
            ) : (
                <DragAndDropQuiz activity={activity} />
            )}
        </div>
    );
}
