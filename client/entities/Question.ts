import { QnA } from "./entities";

export default class Question {
    id!: number;

    created!: Date;

    question!: string;

    read!: boolean;

    authorName!: string;

    QnA!: QnA;
}
