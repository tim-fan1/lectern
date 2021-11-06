class Question {
    question!: string;
    read!: boolean;
    authorName!: string;
}

export default class QnA {
    questions: Question[] = [];
    open: boolean;
}

// TODO: add tgql and orm decorators
