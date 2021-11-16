import { Activity } from "./entities";

export class InputChoice {
    name!: string;

    //DnD
    DnDCorrectPosition?: number;
    DnDVotes?: number[];

    //Poll
    PollVotes?: number;

    //Quiz
    QuizIsCorrect?: boolean;
    QuizVotes?: number;
}

export default class Choice extends InputChoice {
    id!: number;

    /* Many choices belong to one activity. */
    activity!: Activity;
}
