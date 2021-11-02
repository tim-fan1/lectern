import Head from "next/head";
import Link from "next/link";
import router from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../../../components/Navigation";
import styles from "../../../../styles/createPoll.module.css";

/* TODO
 * Hook up to state/backend
 * Need like a "back to" thing
 * Add/delete options
 */
export default function CreatePoll() {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {};

    const [errors, setErrors] = useState([] as string[]);

    const [name, setName] = useState("");

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Create poll</title>
            </Head>
            <Navigation />
            <h1>Create a poll</h1>
            {/* TODO: want a back to dashboard or whatever here */}
            <form className="form" onSubmit={handleSubmit}>
                <input
                    id={styles.input_poll_name}
                    type="text"
                    className="input"
                    placeholder="Name of your poll"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <div id={styles.container_input_poll_option}>
                    <h3>Poll options</h3>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(a)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(b)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(c)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(d)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                        />
                    </div>
                </div>
                <div className="form_container_btn">
                    <button className="btn btn_secondary" onClick={() => router.back()}>
                        Cancel
                    </button>
                    <button className="btn btn_primary">Add poll to session</button>
                </div>
            </form>
            {errors.map((error, i) => (
                <p key={i} className="error">
                    {error}
                </p>
            ))}
        </div>
    );
}
