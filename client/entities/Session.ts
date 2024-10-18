import { User, Activity, QnA } from "./entities";

export type SessionState = "draft" | "open" | "archived";

export default class Session {
    id!: number;

    /* Many sessions belong to one user. */

    author!: User;

    created!: Date;

    updated!: Date;

    state!: SessionState;

    startTime?: Date;

    endTime?: Date;

    /* One session contains many activities. */

    activities!: Activity[];

    qna!: QnA;

    group?: string;

    name!: string;

    code?: string;

    numJoined: number = 0;
}
