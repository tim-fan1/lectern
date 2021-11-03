import { Connection } from "typeorm";
import { Session } from "../entities/entities";

/**
 * A LiveSession is a wrapper around the Session entity that provides methods
 * for any session interaction that can occur while a session is open. The
 * primary reason is so that changes are not written directly out to database,
 * but rather periodically (time interval or using heuristics).
 */
export default class LiveSession {
    readonly session: Session;
    readonly _conn: Connection;

    constructor(conn: Connection, sess: Session) {
        this.session = sess;
        this._conn = conn;
    }

    /**
     * Vote for a choice in a poll.
     */
    pollVote(activityId: number, choiceId: number): boolean {
        const activity = this.session.activities.find(
            (a) => a.id === activityId
        );
        if (activity === undefined) return false;

        const choice = activity.choices.find((c) => c.id === choiceId);
        if (choice === undefined) return false;

        choice.votes++;
        return true;
    }

    startActivity(activityId: number): boolean {
        const thisActivity = this.session.activities.find(
            (a) => a.id === activityId
        );
        if (thisActivity === undefined) return false;

        thisActivity.state = "open";
        return true;
    }

    /**
     * Increment numJoined in the session.
     */
    incrementCount() {
        this.session.numJoined++;
    }

    /**
     * Save the current state of the session to the database. Throws an error
     * if something hecks up.
     */
    async save() {
        await this._conn.getRepository(Session).save(this.session);
    }

    /**
     * Close a session. Sets the session's state to archived and saves out to
     * database. Remember to remove this LiveSession from your list of sessions
     * just before closing.
     */
    async close() {
        this.session.state = "archived";
        this.session.endTime = new Date();
        this.save();
    }

    /**
     * Create a LiveSession from the ID of a session. Looks it up in the db,
     * and throws an error if it can't find it
     * @param conn the current database connection
     * @param id ID of the session to look up
     * @returns the created session isn't that obvious god i hate jsdoc
     */
    static async fromId(conn: Connection, id: number): Promise<LiveSession> {
        return new LiveSession(
            conn,
            await conn.getRepository(Session).findOneOrFail(id)
        );
    }
}
