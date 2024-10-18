import { Session, Choice } from "./entities";

type ActivityState = "draft" | "open" | "archived";

export default class Activity {
    id!: number;

    kind!: string;

    name!: string;

    /* Many activities belong to one session. */

    session!: Session;

    state!: ActivityState;

    choices!: Choice[];
}
