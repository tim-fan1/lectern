import QnA from "../entities/QnA";
import QaQuestion from "./QaQuestion";

interface Props {
    qna: QnA;
}

export default function Qa({ qna }: Props) {
    return (
        <div className="container_center">
            <h2>{qna.questions.length} questions asked</h2>
            {qna.questions.length === 0 && <p>Questions asked by students will appear here!</p>}
            {qna.questions.map((question, i) => (
                <QaQuestion
                    key={i}
                    author={question.authorName ? question.authorName : "Anonymous"}
                    question={question.question}
                />
            ))}
        </div>
    );
}
