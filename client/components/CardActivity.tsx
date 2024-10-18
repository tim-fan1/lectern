import { useState } from "react";
import { useMutation } from "urql";
import { ActivityState } from "../utils/util";
import styles from "../styles/CardActivity.module.css";
import { MarkdownText } from "./MarkdownText";

const MutationStartActivity = `
    mutation ($sessionId: Int!, $activityId: Int!) {
        startActivity(sessionId: $sessionId, activityId: $activityId) {
            errors {
                kind
                msg
            }
        }
    }
`;

const MutationCloseActivity = `
    mutation ($sessionId: Int!, $activityId: Int!) {
        closeActivity(sessionId: $sessionId, activityId: $activityId) {
            errors {
                kind
                msg
            }
        }
    }
`;

interface Props {
    id: number;
    sessionId: number;
    name: string;
    state: ActivityState;
}

export default function CardActivity({ id, sessionId, name, state }: Props) {
    const [startActivityResult, startActivity] = useMutation(MutationStartActivity);
    const [closeActivityResult, closeActivity] = useMutation(MutationCloseActivity);

    const [activityState, setActivityState] = useState(state);

    const [error, setError] = useState("");

    const handleStartActivity = () => {
        const variables = { activityId: id, sessionId: sessionId };
        startActivity(variables).then((result) => {
            if (result.data.startActivity.errors.length === 0) {
                setError("");
                setActivityState(ActivityState.OPEN);
            } else {
                setError("Could not open activity.");
            }
        });
    };

    const handleCloseActivity = () => {
        const variables = { activityId: id, sessionId: sessionId };
        closeActivity(variables).then((result) => {
            if (result.data.closeActivity.errors.length === 0) {
                setError("");
                setActivityState(ActivityState.ARCHIVED);
            } else {
                setError("Could not close activity.");
            }
        });
    };

    return (
        <div>
            {error && <p className="error">{error}</p>}

            <div className={styles.container}>
                <MarkdownText className={styles.name} text={name} />
                {activityState === ActivityState.DRAFT && <a onClick={handleStartActivity}>Open</a>}
                {activityState === ActivityState.OPEN && <a onClick={handleCloseActivity}>Close</a>}
                {activityState === ActivityState.ARCHIVED && <p>Archived</p>}
            </div>
        </div>
    );
}
