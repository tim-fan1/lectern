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

const MutationCloseSession = `
    mutation ($id: Float!) {
        closeSession(id: $id) {
            session {
                endTime
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
    const [startSessionResult, startSession] = useMutation(MutationStartSession);
    const [closeSessionResult, closeSession] = useMutation(MutationCloseSession);

    // TODO: error handling could be done better here. Little information is given to the user, perhaps it's fine though?
    const [error, setError] = useState("");

    const handleStartSession = () => {
        startSession({ id: id }).then((result) => {
            if (result.data.startSession.errors.length == 0) {
                setError("");
                state = SessionState.open;
                /* startSession generates a code, so we set that prop since it previously didn't exist .*/
                code = result.data.startSession.session.code;
            } else {
                setError(`Could not start session "${name}". Please try again.`);
            }
        });
    };

    const handleCloseSession = () => {
        closeSession({ id: id }).then((result) => {
            if (result.data.closeSession.errors.length == 0) {
                setError("");
                state = SessionState.archived;
                endTime = result.data.closeSession.session.endTime;
            } else {
                setError(`Could not close session "${name}". Please try again.`);
            }
        });
    };

    return (
        <div>
            {error && (
                <p id={styles.error} className="error">
                    {error}
                </p>
            )}
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
                            state == SessionState.draft ? handleStartSession : handleCloseSession
                        }
                    >
                        {state == SessionState.draft && "Start session"}
                        {state == SessionState.open && "Close session"}
                    </a>
                    {/* We have the invariant that if the session state is in open, then we will have a non-null code. */}
                    {state == SessionState.open && (
                        <Link href={`/instructor/present/${code}`}>
                            <a>Present</a>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
