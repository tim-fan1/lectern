import Link from "next/link";
import { useState } from "react";
import { useMutation } from "urql";
import styles from "../styles/CardSession.module.css";
import { sessionDateToString, SessionState } from "../utils/util";
import Modal from "./Modal";

const MutationStartSession = `
    mutation ($id: Int!) {
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
    mutation ($id: Int!) {
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

const MutationDuplicateSession = `
mutation($name: String!, $id: Int!) {
    duplicateSession(name: $name, id: $id) {
        errors {
            kind,
            msg
        },
        session {
            id
        }
    }
}
`;

interface Props {
    code?: string;
    id: number;
    name: string;
    state: SessionState;
    startTime?: Date;
    endTime?: Date;
}

export default function CardSession({ code, id, name, state, startTime, endTime }: Props) {
    const [startSessionResult, startSession] = useMutation(MutationStartSession);
    const [closeSessionResult, closeSession] = useMutation(MutationCloseSession);
    const [_, duplicateSession] = useMutation(MutationDuplicateSession);

    const [showModal, setShowModal] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalDuplicateText, setModalDuplicateText] = useState("");

    const [sessionState, setSessionState] = useState(state);

    const [error, setError] = useState("");

    const handleStartSession = () => {
        startSession({ id: id }).then((result) => {
            if (result.data.startSession.errors.length === 0) {
                setError("");
                setSessionState(SessionState.OPEN);
                /* startSession generates a code, so we set that prop since it previously didn't exist .*/
                code = result.data.startSession.session.code;
            } else {
                setError(`Could not start session "${name}". Please try again.`);
            }
        });
    };

    const handleCloseSession = () => {
        closeSession({ id: id }).then((result) => {
            if (result.data.closeSession.errors.length === 0) {
                setError("");
                setSessionState(SessionState.ARCHIVED);
                endTime = result.data.closeSession.session.endTime;
            } else {
                setError(`Could not close session "${name}". Please try again.`);
            }
        });
    };

    interface test {
        kind: string;
        msg: string;
    }
    const submitDuplicate = async (
        id: number,
        modalDuplicateText: string
    ): Promise<[true, null] | [false, string]> => {
        const res = await duplicateSession({ id: id, name: modalDuplicateText });
        if (res.error) {
            return [false, res.error.message];
        } else if (res.data.duplicateSession.errors.length !== 0) {
            return [false, (res.data.duplicateSession.errors as test[]).map((e) => e.kind).join()];
        }
        return [true, null];
    };

    return (
        <div>
            {error && <p className="error">{error}</p>}
            <div className={styles.container}>
                <h3 className={styles.name}>{name}</h3>
                <div className={styles.datetimes}>
                    {startTime && <p>{`${sessionDateToString(new Date(startTime))}`}</p>}
                    {endTime && <p>{`${sessionDateToString(new Date(endTime))}`}</p>}
                </div>
                <div id={styles.container_actions}>
                    <a
                        onClick={
                            sessionState === SessionState.DRAFT
                                ? handleStartSession
                                : handleCloseSession
                        }
                    >
                        {sessionState === SessionState.DRAFT && "Open"}
                        {sessionState === SessionState.OPEN && "Close"}
                    </a>
                    {/* We have the invariant that if the session state is in open, then we will have a non-null code. */}
                    {sessionState === SessionState.OPEN && (
                        <>
                            <Link href={`/instructor/${code}/present`}>
                                <a>Present</a>
                            </Link>

                            <Link href={`/instructor/${code}/`}>
                                <a className={styles.link_manage}>Manage</a>
                            </Link>
                        </>
                    )}
                    {sessionState !== SessionState.OPEN && (
                        <>
                            <Modal
                                show={showModal}
                                onClose={() => setShowModal(false)}
                                title={
                                    <div className="container_center">
                                        <h2>Duplicate Session: {name}</h2>
                                    </div>
                                }
                            >
                                <div className="container_center">
                                    <input
                                        className="input"
                                        value={modalDuplicateText}
                                        placeholder={`${name} (duplicate)`}
                                        onChange={(e) =>
                                            setModalDuplicateText(e.currentTarget.value)
                                        }
                                        required
                                    />
                                    <button
                                        className="btn btn_primary"
                                        onClick={async () => {
                                            /* If we don't get an inputted name then we just take the placeholder. */
                                            let duplicateName = modalDuplicateText;
                                            if (modalDuplicateText.length === 0) {
                                                duplicateName = `${name} (duplicate)`;
                                            }

                                            const [success, errorMsg] = await submitDuplicate(
                                                id,
                                                duplicateName
                                            );
                                            if (!success) {
                                                setModalError(errorMsg!);
                                            } else {
                                                setShowModal(false);
                                                setModalError("");
                                            }
                                        }}
                                    >
                                        Submit
                                    </button>
                                    {<p className="error">{modalError}</p>}
                                </div>
                            </Modal>
                            <a
                                onClick={() => {
                                    setShowModal(true);
                                }}
                            >
                                Duplicate
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
