import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import styles from "../styles/QaInput.module.css";

const MutationQuestion = `
    mutation ($sessionId: Int!, $question: String!, $name: String) {
        submitQuestion(sessionId: $sessionId, question: $question, name: $name) {
            errors { kind, msg }
        }
    }
`;

interface Props {
    sessionId: number;
    name?: string;
}

export default function QaInput({ name, sessionId }: Props) {
    const [question, setQuestion] = useState("");
    const [submitQResponse, submitQ] = useMutation(MutationQuestion);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitQuestion = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        const variables = {
            sessionId: sessionId,
            question: question,
            name: name,
        };
        submitQ(variables).then(() => {
            setQuestion("");
            setSubmitting(false);
        });
    };

    return (
        <form className="container_center" onSubmit={handleSubmitQuestion}>
            <textarea
                value={question}
                placeholder="Type your question"
                id={styles.question_textarea}
                onChange={(e) => setQuestion(e.target.value)}
                className={submitting ? styles.disabled : ""}
                disabled={submitting}
            />
            <div id={styles.question_container_submit}>
                <p>
                    <span>Posting as {!name && "anonymous"}</span>
                    {name}
                </p>
                <button className="btn btn_primary">Submit question</button>
            </div>
        </form>
    );
}
