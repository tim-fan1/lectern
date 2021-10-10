import Link from "next/link";
import Navigation from "../../components/Navigation";
import styles from "../../styles/create.module.css";

export default function Dashboard() {
    return (
        <div className="container_center">
            <Navigation />
            <Link href="/instructor/dashboard">
                <a>Back to dashboard</a>
            </Link>
            <input
                id={styles.input_session_name}
                type="text"
                placeholder="Session name (click to edit)"
            />
            <div
                id={styles.container_add_activity}
                className="container_center"
            >
                <h2>
                    Prepare session activities to activate during the session
                </h2>
                <div id={styles.container_create_cards}>
                    <Link href="/instructor/create">
                        <a className={styles.card_create_activity}>
                            Create a Poll (soon™)
                        </a>
                    </Link>
                    <Link href="/instructor/create">
                        <a className={styles.card_create_activity}>
                            Create a Quiz (soon™)
                        </a>
                    </Link>
                    <Link href="/instructor/create">
                        <a className={styles.card_create_activity}>
                            Create a Q&A (soon™)
                        </a>
                    </Link>
                </div>
            </div>
            <div id={styles.container_btn}>
                <button className="btn btn_secondary">Cancel</button>
                <button className="btn btn_primary">Create session</button>
            </div>
        </div>
    );
}
