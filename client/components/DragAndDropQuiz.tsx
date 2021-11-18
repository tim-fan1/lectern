import { FormEvent, useState } from "react";
import styles from "../styles/Poll.module.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StyledComponent } from "styled-components";
import { Activity } from "../entities/entities";
import { useMutation } from "urql";
import DragAndDropQuizResults from "./DragAndDropQuizResults";
import { useAppSelector } from "../state/hooks";
import { selectSession } from "../state/sessionSlice";
import { MarkdownText } from "./MarkdownText";
export interface DragAndDropProps {
    activity: Activity;
    setHasVotedQuizState: Function;
}
interface Answer {
    name: string;
    choiceId: number;
}
export interface thing {
    title: string;
    answers: Answer[];
}

const MutationDNDQuizVote = `
    mutation ($sessionId: Int!, $activityId: Int!, $choiceId: Int!, $DnDPosition: Int!) {
        activityVote(sessionId: $sessionId, activityId: $activityId, choiceId: $choiceId, DnDPosition: $DnDPosition) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function DragAndDropQuiz({ activity, setHasVotedQuizState }: DragAndDropProps) {
    const title = activity.name;
    const session = useAppSelector(selectSession)!;
    const [quizVoteResult, quizVote] = useMutation(MutationDNDQuizVote);
    const [answers, setAnswers] = useState(() => {
        const ret = [] as Answer[];
        for (const choice of activity.choices) {
            ret.push({
                choiceId: choice.id,
                name: choice.name,
            });
        }
        ret.sort(() => Math.random() - 0.5);
        return ret;
    });
    const submitSelectedAnswer = () => {
        let i = 0;
        let success = true;
        for (const answer of answers) {
            const variables = {
                sessionId: session.id,
                activityId: activity.id,
                /* We are considering the choice with id choice.id. */
                choiceId: answer.choiceId,
                /* The student placed this choice at position i on their screen. */
                DnDPosition: i,
            };
            quizVote(variables).then((result) => {
                if (result.data.activityVote.errors.length !== 0) {
                    // setError("Could not submit quiz vote.");
                    success = false;
                }
            });
            i++;
        }
        if (success) setHasVotedQuizState([true, activity.id]);
    };
    return (
        <>
            <h1 style={{ textAlign: "center" }}>
                Click and drag the blocks into the correct order
            </h1>
            <DragDropContext
                onDragEnd={(result) => {
                    const { destination, source } = result;
                    if (!destination) {
                        return;
                    }
                    if (
                        destination.droppableId === source.droppableId &&
                        destination.index === source.index
                    ) {
                        return;
                    }
                    const newAnswers = Array.from(answers);
                    /* Remove the element right after source.index. */
                    newAnswers.splice(source.index, 1);
                    /* Place the element at destination.index. */
                    newAnswers.splice(destination.index, 0, answers[source.index]);
                    /* Set answers to be this. */
                    setAnswers(newAnswers);
                }}
            >
                <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem" }}>
                    <h2 style={{ maxWidth: "80%", textAlign: "center" }}>Q:{title}</h2>
                </div>
                <Droppable droppableId="1">
                    {(provided, snapShot) => (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <div
                                className={styles.poll_box}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                <form
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    {answers.map((answer, index) => {
                                        return (
                                            <Draggable
                                                key={index}
                                                draggableId={`draggable-${index}`}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.dragHandleProps}
                                                        {...provided.draggableProps}
                                                    >
                                                        <div
                                                            style={{
                                                                margin: "1rem",
                                                                backgroundColor: "var(--c-text)",
                                                                color: "black",
                                                                padding: "1.5rem 3rem",
                                                                border: "var(--c-background-primary) 1px solid",
                                                                borderRadius: "2px",
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            <MarkdownText text={answer.name} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                </form>
                                {provided.placeholder}
                            </div>
                            <input
                                className={"btn btn_call_to_action"}
                                type={"click"}
                                value={"Submit"}
                                onClick={submitSelectedAnswer}
                            />
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
}
