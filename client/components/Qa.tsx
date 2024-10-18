import QnA from "../entities/QnA";
import QaQuestion from "./QaQuestion";
import styles from "../styles/Qa.module.css";

interface Props {
    qna: QnA;
}

export default function Qa({ qna }: Props) {
    const questions = qna.questions
        .map((a) => a)
        .sort((q1, q2) => new Date(q2.created).getTime() - new Date(q1.created).getTime());
    return (
        <div className="container_center">
            <h2 className={styles.header}>{qna.questions.length} questions asked</h2>
            {questions.length === 0 && <p>Questions asked by students will appear here!</p>}
            {questions.map((question, i) => (
                <QaQuestion
                    key={i}
                    author={question.authorName ? question.authorName : "Anonymous"}
                    question={question.question}
                />
            ))}
        </div>
    );
}
