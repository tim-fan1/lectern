import { useState } from "react";
import styles from "../styles/QaInput.module.css";

interface Props {
    name: string;
}

export default function QaInput({ name }: Props) {
    const [question, setQuestion] = useState("");

    const handleSubmitQuestion = () => {};

    return (
        <form className="container_center" onSubmit={handleSubmitQuestion}>
            <textarea
                value={question}
                placeholder="Type your question"
                id={styles.question_textarea}
                onChange={(e) => setQuestion(e.target.value)}
            />
            <div id={styles.question_container_submit}>
                <p>{name}</p>
                <button className="btn btn_primary">Submit question</button>
            </div>
        </form>
    );
}
