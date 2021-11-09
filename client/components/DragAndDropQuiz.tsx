import { useState } from "react";
import styles from "../styles/Poll.module.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StyledComponent } from "styled-components";
export interface DragAndDropProps {
    title: string;
    answers: Array<string>;
}
export default function DragAndDropQuiz({ title, answers }: DragAndDropProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const submitSelectedAnswer = () => {
        // TODO:
    };
    return (
        <DragDropContext onDragEnd={() => console.log("here")}>
            <Droppable droppableId="1">
                {(provided, snapShot) => (
                    <div
                        className={styles.poll_box}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        <h2>{title}</h2>
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
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
