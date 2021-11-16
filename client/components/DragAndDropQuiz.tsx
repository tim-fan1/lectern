import { useState } from "react";
import styles from "../styles/Poll.module.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StyledComponent } from "styled-components";
import { Activity } from "../entities/entities";
export interface DragAndDropProps {
    activity: Activity;
}
export interface thing {
    title: string;
    answers: Array<string>;
}
export default function DragAndDropQuiz({ activity }: DragAndDropProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitSelectedAnswer = () => {
        // TODO:
        console.log(answers);
    };
    const title = "TODO";
    const [answers, setAnswers] = useState(["TODO"]);
    return (
        <>
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
                    <h2 style={{ maxWidth: "80%", textAlign: "center" }}>{title}</h2>
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
                                                                borderRadius: "5px",
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            {answer}
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
                                type={"button"}
                                value={"Submit"}
                                onClick={(e) => submitSelectedAnswer()}
                            />
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
}
