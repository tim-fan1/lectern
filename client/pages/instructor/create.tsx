import Link from "next/link";
import Navigation from "../../components/Navigation";
import styles from "../../styles/Create.module.css";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import { useRouter } from "next/router";

const MutationSession = `
    mutation ($group: String!, $name: String!) {
        createSession(group: $group, name: $name) {
            errors {
                kind,
                msg
            }
            session {
                created,
                id,
                name,
                startTime,
            }
        }
    }
`;

export default function Dashboard() {
    const router = useRouter();
    const [_, createSession] = useMutation(MutationSession);
    /* "error" message */
    const [errorMessage, setErrorMessage] = useState("");

    const [name, setName] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            group: "owo",
            name: name,
        };
        createSession(variables).then((result) => {
            console.log(result.data);
            if (result.data.createSession.errors.length === 0) {
                router.push("/instructor/dashboard");
            } else {
                setErrorMessage(
                    `Could not create the session: ${result.data.createSession.errors}`
                );
            }
        });
    };

    return (
        <div className="container_center">
            <Navigation />
            <Link href="/instructor/dashboard">
                <a>Back to dashboard</a>
            </Link>
            <form onSubmit={handleSubmit}>
                <input
                    id={styles.input_session_name}
                    type="text"
                    placeholder="Session name (click to edit)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div id={styles.container_add_activity} className="container_center">
                    <h2>Prepare session activities to activate during the session</h2>
                    <div id={styles.container_create_cards}>
                        <Link href="/instructor/create">
                            <a className={styles.card_create_activity}>Create a Poll (soon™)</a>
                        </Link>
                        <Link href="/instructor/create">
                            <a className={styles.card_create_activity}>Create a Quiz (soon™)</a>
                        </Link>
                        <Link href="/instructor/create">
                            <a className={styles.card_create_activity}>Create a Q&A (soon™)</a>
                        </Link>
                    </div>
                </div>
                <div id={styles.container_btn}>
                    <button type="reset" className="btn btn_secondary">
                        Reset
                    </button>
                    <button className="btn btn_primary">Create session</button>
                </div>
                {errorMessage && <p className="error">{errorMessage}</p>}
            </form>
        </div>
    );
}
