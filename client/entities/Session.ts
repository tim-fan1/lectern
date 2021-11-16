import { User, Activity } from "./entities";

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

    group?: string;

    name!: string;

    code?: string;

    // TODO: this is a field to test live sessions, but may well be useful anyways
    // this only exists in-memory and not in the database (not a column) so if this
    // is changing then we know something's working

    numJoined: number = 0;
}
