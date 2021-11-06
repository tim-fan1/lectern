import { Activity } from "./entities";

export default class Choice {
    id!: number;

    name!: string;

    votes!: number;

    /* Many choices belong to one activity. */
    activity!: Activity;
}
