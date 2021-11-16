import { Session, Choice } from "./entities";

type ActivityState = "draft" | "open" | "archived";

export default class Activity {
    id!: number;

    /* TODO: probably change how this works if there is a better way.
     * can be "POLL", "MCQUIZ", etc. */

    kind!: string;

    name!: string;

    /* Many activities belong to one session. */

    session!: Session;

    state!: ActivityState;

    choices!: Choice[];
}
