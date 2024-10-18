import { FormEvent, useState } from "react";
import styles from "../styles/Poll.module.css";
import { Activity } from "../entities/entities";
import { activityStateFromString } from "../utils/util";
import { useAppSelector } from "../state/hooks";
import { selectSession } from "../state/sessionSlice";
import { useMutation } from "urql";
import { MarkdownText } from "./MarkdownText";

const MutationQuizVote = `
    mutation ($sessionId: Int!, $activityId: Int!, $choiceId: Int!) {
        activityVote(sessionId: $sessionId, activityId: $activityId, choiceId: $choiceId) {
            errors {
                kind
                msg
            }
        }
    }
`;

export interface MultipleChoiceProps {
    activity: Activity;
    setHasVotedQuizState: Function;
}
export default function MultipleChoiceQuiz({
    activity,
    setHasVotedQuizState,
}: MultipleChoiceProps) {
    const session = useAppSelector(selectSession)!;
    const [quizVoteResult, quizVote] = useMutation(MutationQuizVote);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState("");
    const submitSelectedAnswer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const variables = {
            sessionId: session.id,
            activityId: activity.id,
            choiceId: activity.choices[selectedIndex].id,
        };
        quizVote(variables).then((result) => {
            if (result.data.activityVote.errors.length === 0) {
                setHasVotedQuizState([true, activity.id]);
            } else {
                setError("Could not submit quiz vote.");
            }
        });
    };
    return (
        <div className={styles.container_poll}>
            {/* <h2 className={styles.poll_question}>{activity.name}</h2> */}
            <form className={"form"} onSubmit={submitSelectedAnswer}>
                <div className={styles.poll_question}>
                    <MarkdownText text={activity.name} />
                </div>
                {activity.choices.map((choice, index) => {
                    let classNamePollOption = styles.poll_option;
                    if (index === selectedIndex) {
                        classNamePollOption += " " + styles.poll_option_selected;
                    }
                    return (
                        <div
                            className={classNamePollOption}
                            key={index}
                            onClick={(e) => setSelectedIndex(index)}
                        >
                            <input
                                type={"radio"}
                                className={styles.poll_option_radio_input}
                                name={"pollRadio"}
                                checked={index === selectedIndex}
                                onChange={() => setSelectedIndex(index)}
                            />
                            <MarkdownText text={choice.name} className={styles.poll_option_text} />
                        </div>
                    );
                })}
                <button type="submit" className="btn btn_call_to_action">
                    Vote
                </button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
}
