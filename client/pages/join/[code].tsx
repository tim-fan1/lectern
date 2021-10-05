import { useRouter } from "next/router";
import Navigation from "../../components/Navigation";
import styles from "../../styles/JoinCode.module.css";
import formStyles from "../../styles/Form.module.css";

export default function JoinWithCode() {
    /* TODO: Check that code is valid since it simply comes from the user defined route. */
    const router = useRouter();
    const { code } = router.query;

    return (
        <div className="centered_container">
            <Navigation />
            <h2 id={styles.header_enter_session}>
                About to enter session <span id={styles.code}>{code}</span>
            </h2>
            <h1 id={styles.header_session_title}>Example session title.</h1>
            <div>
                <div>
                    <h3>Instructor name</h3>
                    <p>This is the bio of the instructor.</p>
                </div>
            </div>

            <form className={formStyles.container} id={styles.form_join}>
                <div className={formStyles.input_container}>
                    <label className={formStyles.label}>
                        Enter your name to be displayed (optional)
                    </label>
                    <input className={formStyles.input} type="text" />
                </div>
                <button
                    className={formStyles.btn_submit}
                    id={styles.btn_continue}
                    type="submit"
                >
                    Continue
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 0 24 24"
                        width="24px"
                        fill="#000000"
                    >
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path d="M10.02 6L8.61 7.41 13.19 12l-4.58 4.59L10.02 18l6-6-6-6z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
