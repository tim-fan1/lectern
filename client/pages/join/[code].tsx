import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useClient } from "urql";
import { validateSessionCode } from "../../util";
import Navigation from "../../components/Navigation";
import styles from "../../styles/joincode.module.css";

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session
            errors {
                kind
                msg
            }
        }
    }
`;

export default function JoinCode() {
    const router = useRouter();
    const client = useClient();
    const { code } = router.query;

    const [displayName, setDisplayName] = useState("");

    /* Since this component does represent a possible route in the app, we have to consider that
     * the user has entered an invalid session code by entering it in the URL, even though there
     * are checks on the join form. */
    let isValidCode = true;
    if (code === undefined || typeof code != "string" || !validateSessionCode(code)) {
        isValidCode = false;
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        client
            .query(QuerySessionDetails, { code: code })
            .toPromise()
            .then((result) => console.log(result));
    };

    return (
        <div className="container_center">
            <Navigation />
            {isValidCode && (
                <div>
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

                    <form
                        className="container_center"
                        id={styles.form_join}
                        onSubmit={handleSubmit}
                    >
                        <div className="container_input_label">
                            <label className="label">
                                Enter your name to be displayed (optional)
                            </label>
                            <input
                                className="input"
                                type="text"
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <button className="btn btn_primary" id={styles.btn_continue} type="submit">
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
            )}
            {!isValidCode && (
                <div id={styles.container_invalid_code}>
                    <h2>
                        The session code <b>#{code}</b> entered is either invalid or expired.
                    </h2>
                    <h2>Please double check it is the correct code.</h2>
                    <Link href="/">
                        <a>Back to home.</a>
                    </Link>
                </div>
            )}
        </div>
    );
}
