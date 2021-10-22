import Link from "next/link";
import { useState } from "react";
import { useMutation } from "urql";
import styles from "../styles/CardSession.module.css";
import { sessionDateToString, SessionState } from "../util";

const MutationStartSession = `
    mutation ($id: Float!) {
        startSession(id: $id) {
            session {
                code
            }
            errors {
                kind
                msg
            }
        }
    }
`;

interface Props {
    code?: string;
    id: number;
    name: string;
    state: SessionState;
    startTime?: string;
    endTime?: string;
}

export default function CardSession({ code, id, name, state, startTime, endTime }: Props) {
    const [sessionState, setSessionState] = useState(state);
    const [_, startSession] = useMutation(MutationStartSession);

    const handleStartSession = () => {
        const variables = {
            id: id,
        };
        startSession(variables).then((result) => {
            if (result.data.startSession.errors.length == 0) {
                setSessionState(SessionState.open);
                /* Since we have now started the session, the server has generated a code, therefore we must update
                 * the prop as at this point it will be null since the session was previously in an open state. */
                code = result.data.startSession.session.code;
            } else {
                // TODO
            }
        });
    };

    const handleCloseSession = () => {};

    return (
        <div className={styles.container}>
            <h3 className={styles.name}>
                <b>{name}</b>
            </h3>
            <div className={styles.datetimes}>
                {startTime && <p>{`${sessionDateToString(new Date(startTime))}`}</p>}
                {endTime && <p>{`${sessionDateToString(new Date(endTime))}`}</p>}
            </div>
            <div id={styles.container_actions}>
                <a
                    className={styles.btn_change_state}
                    onClick={
                        sessionState == SessionState.draft ? handleStartSession : handleCloseSession
                    }
                >
                    {sessionState == SessionState.draft && "Start session"}
                    {sessionState == SessionState.open && "Close session"}
                </a>
                {/* We have the invariant that if the session state is in open, then we will have a non-null code. */}
                {sessionState == SessionState.open && (
                    <Link href={`/instructor/present/${code}`}>
                        <a>Present</a>
                    </Link>
                )}
            </div>
        </div>
    );
}
