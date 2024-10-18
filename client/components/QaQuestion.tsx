import styles from "../styles/QaQuestion.module.css";
import { MarkdownText } from "./MarkdownText";

interface Props {
    author?: string;
    question: string;
}

export default function QaQuestion({ author, question }: Props) {
    return (
        <div className={styles.container}>
            <h3>{author} asks...</h3>
            <MarkdownText text={question} />
        </div>
    );
}
