import QaQuestion from "./QaQuestion";

const questions = [
    {
        author: "Ivan",
        question: "what's your name?",
    },
    {
        author: "Brian",
        question: "do you cook food much?",
    },
    {
        author: "Anonymous",
        question:
            "rreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyeally long question",
    },
];

export default function Qa() {
    return (
        <div className="container_center">
            <h2>{questions.length} questions asked</h2>
            {questions.length === 0 && <p>Questions asked by students will appear here!</p>}
            {questions.map((question, i) => (
                <QaQuestion key={i} author={question.author} question={question.question} />
            ))}
        </div>
    );
}
