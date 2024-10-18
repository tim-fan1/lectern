import { QnA } from "./entities";

export default class Question {
    id!: number;

    created!: string;

    question!: string;

    read!: boolean;

    authorName!: string;

    QnA!: QnA;
}
