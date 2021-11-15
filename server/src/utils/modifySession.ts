import { getRepository } from "typeorm";
import { Session } from "../entities/entities";
import LiveSession from "./liveSession";
import { Either, left, RespError, right } from "../types";
import { SessionErrors } from "../resolvers/session";

export async function getSession(
    opens: Map<number, LiveSession>,
    where: { id?: number; code?: string },
    relations: string[] = []
) {
    return modifySession(opens, where, (s) => right(s), relations);
}

/**
 * Finds a session by id or code, then modifies it in the right place (either
 * in-memory or in the database depending on the state of the session) using
 * a function argument that mutates a Session.
 * @param opens The map of openSessions (can get from context)
 * @param where An object containing lookup criteria (either id or code)
 * @param change A function which takes a Session and returns a changed Session
 * @param saveNow Set to true to save immediately to the database (e.g. if
 *                you've added a new relation and need an ID generated)
 * @returns Either a RespError (error object) or the changed session.
 */
export default async function modifySession(
    opens: Map<number, LiveSession>,
    where: { id?: number; code?: string },
    change: (
        s: Session
    ) => Either<RespError, Session> | Promise<Either<RespError, Session>> = (
        s
    ) => right(s),
    relations: string[] = [],
    saveNow: boolean = false
): Promise<Either<RespError, Session>> {
    /* Get the session */
    let session: Session;
    let live: LiveSession | undefined = undefined;
    /* If the session is open (and we don't want extra relations) use live ver */
    if (relations.length === 0 && where.id && opens.has(where.id)) {
        live = opens.get(where.id);
        if (live === undefined)
            return left({ kind: SessionErrors.SESSION_NOT_EXIST });
        session = live.getSession();
    } else {
        try {
            let maybeSession = await getRepository(Session).findOne({
                where: where,
                relations: relations,
            });
            if (maybeSession === undefined)
                return left({ kind: SessionErrors.SESSION_NOT_EXIST });
            session = maybeSession;
        } catch (e) {
            return left({ kind: SessionErrors.DB_ERROR });
        }
        /* If session is open, use the in-memory session instead
         * This raises the question: why do we store & query live sessions
         * by id instead of code? The important part is that the frontend
         * uses an id; codes can be re-used, but ids cannot, so the frontend
         * won't accidentally get data from another session if it queries
         * using ids. This is a really unlikely case but yeah haha hafdsv */
        if (session && session.state === "open") {
            live = opens.get(session.id);
            if (live === undefined)
                return left({ kind: SessionErrors.SESSION_NOT_EXIST });
            session = live.getSession();
        }
        if (session === undefined)
            return left({ kind: SessionErrors.SESSION_NOT_EXIST });
    }

    /* Make the change */
    const result = await change(session);
    if (result.isLeft) {
        return left(result.data);
    } else {
        session = result.data;
    }

    /* Commit it */
    if (live !== undefined) {
        try {
            await live.updateSession(session, saveNow);
        } catch (e: any) {
            return left({ kind: SessionErrors.DB_ERROR, msg: e.toString() });
        }
        session = live.getSession();
    } else
        try {
            session = await getRepository(Session).save(session);
        } catch (e: any) {
            return left({ kind: SessionErrors.DB_ERROR, msg: e.toString() });
        }

    return right(session);
}
