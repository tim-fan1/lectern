import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../../components/Navigation";
import styles from "../../styles/create.module.css";

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

    const [name, setName] = useState("");

    const [errors, setErrors] = useState([] as string[]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            group: "owo",
            name: name,
        };
        createSession(variables).then((result) => {
            if (result.data.createSession.errors.length === 0) {
                router.push("/instructor/dashboard");
            } else {
                const errorMessages = result.data.register.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Create session</title>
            </Head>
            <Navigation />
            <h2>Create a new session</h2>
            <form onSubmit={handleSubmit}>
                <input
                    id={styles.input_session_name}
                    type="text"
                    placeholder="Session name (click to edit)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
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
                    <Link href="/instructor/dashboard" passHref>
                        <button className="btn btn_secondary">Cancel</button>
                    </Link>
                    <button className="btn btn_primary">Save session</button>
                </div>
            </form>
            {errors.map((error, i) => (
                <div key={i}>
                    <p>Could not create session.</p>
                    <p className="error">{error}</p>
                </div>
            ))}
        </div>
    );
}
