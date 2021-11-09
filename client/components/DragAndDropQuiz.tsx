import { useState } from "react";
import styles from "../styles/Poll.module.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StyledComponent } from "styled-components";
export interface DragAndDropProps {
    title: string;
    answers: Array<string>;
}
export default function DragAndDropQuiz({ title, answers: _answers }: DragAndDropProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitSelectedAnswer = () => {
        // TODO:
        console.log(answers);
    };
    const [answers, setAnswers] = useState(_answers);
    return (
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
            <Droppable droppableId="1">
                {(provided, snapShot) => (
                    <div
                        className={styles.poll_box}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        <h2>{title}</h2>
                        <form>
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
                                                <h3>{answer}</h3>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            <input
                                className={"btn btn_call_to_action"}
                                type={"button"}
                                value={"Submit"}
                                onClick={(e) => submitSelectedAnswer()}
                            />
                        </form>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
