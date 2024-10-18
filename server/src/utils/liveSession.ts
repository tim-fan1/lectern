import { PubSubEngine } from "graphql-subscriptions";
import { Connection } from "typeorm";
import { Session } from "../entities/entities";

export const topic = (id: number): string => "SESSION_" + id.toString();

/**
 * A LiveSession is a wrapper around the Session entity that provides methods
 * for any session interaction that can occur while a session is open. The
 * primary reason is so that changes are not written directly out to database,
 * but rather periodically (time interval or using heuristics).
 */
export default class LiveSession {
    private session: Session;
    private readonly _conn: Connection;
    private readonly pubsub: PubSubEngine;

    constructor(conn: Connection, pubsub: PubSubEngine, sess: Session) {
        this.session = sess;
        this._conn = conn;
        this.pubsub = pubsub;
    }

    /**
     * getter in javascript lul
     */
    getSession() {
        return this.session;
    }

    /**
     * Updates the internal in-memory session.
     */
    async updateSession(s: Session, saveNow: boolean = false) {
        this.session = s;
        if (saveNow) await this.save();
        this.tick();
    }

    /**
     * Save the current state of the session to the database. Throws an error
     * if something hecks up. Immediately gets the session again too.
     */
    async save() {
        this.session = await this._conn
            .getRepository(Session)
            .save(this.session);
    }

    /**
     * Close a session. Sets the session's state to archived and saves out to
     * database. Remember to remove this LiveSession from your list of sessions
     * just before closing.
     */
    async close() {
        this.session.state = "archived";
        this.session.endTime = new Date();
        await this.save();
    }

    /**
     * Everything that needs to be done whenever the in-memory session changes.
     */
    private async tick() {
        this.pubsub.publish(topic(this.session.id), this);
        /* For a production version, we would implement some strategy here
         * to periodically save to the database (so we don't overload it). */
    }

    /**
     * Create a LiveSession from the ID of a session. Looks it up in the db,
     * and throws an error if it can't find it
     * @param conn the current database connection
     * @param pubsub a PubSubEngine instance (from @PubSub decorator)
     * @param id ID of the session to look up
     * @returns the created session isn't that obvious god i hate jsdoc
     */
    static async fromId(
        conn: Connection,
        pubsub: PubSubEngine,
        id: number
    ): Promise<LiveSession> {
        return new LiveSession(
            conn,
            pubsub,
            await conn.getRepository(Session).findOneOrFail(id)
        );
    }
}
