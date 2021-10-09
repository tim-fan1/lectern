import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import Navigation from "../components/Navigation";
import styles from "../styles/Home.module.css";

function Home() {
    const [sessionCode, setSessionCode] = useState("");

    return (
        <div className={styles.container}>
            <Head>
                <title>lectern? - Home page</title>
            </Head>

            <Navigation />
            <form className="container_center">
                <h1>Enter session code</h1>
                <div id={styles.input_code_container}>
                    <h1>#</h1>
                    <input
                        type="text"
                        id={styles.input_code}
                        minLength={6}
                        maxLength={6}
                        size={8}
                        placeholder="e.g. 123ABC"
                        value={sessionCode}
                        onChange={(e) =>
                            setSessionCode((e.target as HTMLInputElement).value)
                        }
                        required
                    />
                </div>
                <Link href={`/join/${sessionCode.toUpperCase()}`} passHref>
                    <button id={styles.btn_join} type="submit">
                        Join
                    </button>
                </Link>
            </form>
        </div>
    );
}

export default Home;
