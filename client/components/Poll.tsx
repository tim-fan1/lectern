import styles from "../styles/Poll.module.css";
import { MarkdownText } from "./MarkdownText";
import { FormEvent, useState } from "react";
import { Activity } from "../entities/entities";
import { useAppSelector } from "../state/hooks";
import { selectSession } from "../state/sessionSlice";
import { useMutation } from "urql";
import { useRouter } from "next/router";

const MutationPollVote = `
    mutation ($sessionId: Int!, $activityId: Int!, $choiceId: Int!) {
        activityVote(sessionId: $sessionId, activityId: $activityId, choiceId: $choiceId) {
            errors {
                kind
                msg
            }
        }
    }
`;

interface Props {
    // title: string;
    // // require at least 1 question
    // questions: Array<string>;
    activity: Activity;
    setHasVotedPollState: Function;
}

export default function Poll({ activity, setHasVotedPollState }: Props) {
    /* If we've gotten to this point we can assume that the session is not-null and valid. */
    const session = useAppSelector(selectSession)!;

    const [pollVoteResult, pollVote] = useMutation(MutationPollVote);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState("");

    const handleSubmitPollVote = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const variables = {
            sessionId: session.id,
            activityId: activity.id,
            choiceId: activity.choices[selectedIndex].id,
        };
        pollVote(variables).then((result) => {
            if (result.data.activityVote.errors.length === 0) {
                setHasVotedPollState([true, activity.id]);
            } else {
                setError("Could not submit poll vote.");
            }
        });
    };

    return (
        <div className={styles.container_poll}>
            <form className={`form`} onSubmit={handleSubmitPollVote}>
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
                            onClick={() => setSelectedIndex(index)}
                        >
                            <input
                                type="radio"
                                className={styles.poll_option_radio_input}
                                name="pollRadio"
                                checked={index === selectedIndex}
                                onChange={() => setSelectedIndex(index)}
                            />
                            <MarkdownText text={choice.name} className={styles.poll_option_text} />
                        </div>
                    );
                })}
                <button className="btn btn_call_to_action">Vote</button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
}
