import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "urql";
import { FormEvent, useState } from "react";
import Navigation from "../../../components/Navigation";
import styles from "../../../styles/edit.module.css";

const QueryGetSessionById = `
    query ($id: String!) {
        getSessions (id: $id) {
            errors {
                kind,
                msg
            }
            sessions {
                name,
            }
        }
    }
`;

export default function SessionEdit() {
    const router = useRouter();
    /* The id of the session we are editing. */
    const { id } = router.query;
    const [result] = useQuery({
        query: QueryGetSessionById,
        variables: {
            id: id,
        },
    });
    const { data, fetching, error } = result;
    const [errors, setErrors] = useState([] as string[]);
    const [name, setName] = useState("");
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);
        console.log("hello!");
    };
    return (
        <div>
            {!fetching && (
                <Head>
                    <title>lectern - Editing {data.getSessions.sessions[0].name}</title>
                </Head>
            )}
            <Navigation />
            <div className="container_center">
                <Link href="/instructor/dashboard">
                    <a className="btn btn_primary">Return to dashboard</a>
                </Link>
                {!fetching && <p>Editing {data.getSessions.sessions[0].name}</p>}
                {errors.map((error, i) => (
                    <p className="error" key={i}>
                        {error}
                    </p>
                ))}
                <br />
                <form className="form" onSubmit={handleSubmit}>
                    <div className="container_input_label">
                        <label className="label">New session name</label>
                        <input
                            className="input"
                            type="name"
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </form>
                <div id={styles.container_add_activity} className="container_center">
                    <h2>Prepare session activities to activate during the session</h2>
                    <div id={styles.container_create_cards}>
                        <Link href="/instructor/create/poll">
                            <a className={styles.card_create_activity}>Create a Poll</a>
                        </Link>
                        <Link href="">
                            <a className={styles.card_create_activity}>Create a Quiz (soon™)</a>
                        </Link>
                        <Link href="">
                            <a className={styles.card_create_activity}>Create a Q&A (soon™)</a>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
