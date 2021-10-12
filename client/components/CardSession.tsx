import Link from "next/link";
import { useState } from "react";
import { useMutation } from "urql";
import { dashboardDateToString, SessionState } from "../util";
import styles from "../styles/CardSession.module.css";

interface Props {
    timeCreatedUTC: string;
    name: string;
    id: number;
    state: SessionState;
    code?: string;
}

// TODO: id should not be a float lol.
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

export default function CardSession({ timeCreatedUTC, name, id, state, code }: Props) {
    const timeCreatedString = dashboardDateToString(new Date(timeCreatedUTC));

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
            <p className={styles.datetime}>{`${timeCreatedString}`}</p>
            <a
                className={styles.btn_change_state}
                onClick={
                    sessionState == SessionState.draft ? handleStartSession : handleCloseSession
                }
            >
                {sessionState == SessionState.draft && "Start session"}
                {sessionState == SessionState.open && "Close session (soonTM)"}
            </a>
            {/* We have the invariant that if the session state is in open, then we will have a non-null code. */}
            {sessionState == SessionState.open && (
                <Link href={`/instructor/present/${code}`}>
                    <a>Present</a>
                </Link>
            )}
        </div>
    );
}
