import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../components/Navigation";
import styles from "../styles/index.module.css";

function Home() {
    const router = useRouter();
    const [sessionCode, setSessionCode] = useState("");

    const handleSubmitJoin = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.push(`/join/${sessionCode.toUpperCase()}`);
    };

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Welcome</title>
            </Head>

            <Navigation />

            <h2 id={styles.header_welcome}>
                Get started by joining a session or logging in to make your own sessions!
            </h2>

            <form
                id={styles.form_join}
                className="form container_center"
                onSubmit={handleSubmitJoin}
            >
                <h1>Join a session</h1>
                <div id={styles.input_code_container}>
                    <input
                        type="text"
                        id={styles.input_code}
                        className="input"
                        minLength={6}
                        maxLength={6}
                        placeholder="e.g. 123ABC"
                        value={sessionCode}
                        onChange={(e) => setSessionCode(e.target.value)}
                        required
                    />
                </div>
                <button id={styles.btn_join} className="btn btn_call_to_action" type="submit">
                    Join
                </button>
            </form>
        </div>
    );
}

export default Home;
