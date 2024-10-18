import { Question, Session } from "./entities";

export default class QnA {
    id!: number;

    session!: Session;

    questions!: Question[];

    open: boolean = false;
}
