import QnA from "../entities/QnA";
import QaQuestion from "./QaQuestion";

// const questions = [
//     {
//         author: "Ivan",
//         question: "what's your name?",
//     },
//     {
//         author: "Brian",
//         question: "do you cook food much?",
//     },
//     {
//         author: "Anonymous",
//         question:
//             "rreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyeally long question",
//     },
// ];

interface Props {
    qna: QnA;
}

export default function Qa({ qna }: Props) {
    return (
        <div className="container_center">
            <h2>{qna.questions.length} questions asked</h2>
            {qna.questions.length === 0 && <p>Questions asked by students will appear here!</p>}
            {qna.questions.map((question, i) => (
                <QaQuestion key={i} author={question.authorName} question={question.question} />
            ))}
        </div>
    );
}
