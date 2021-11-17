import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../components/Navigation";
import { useAppDispatch } from "../../state/hooks";
import { updateName, updateSession } from "../../state/sessionSlice";
import styles from "../../styles/join.module.css";
import { validateSessionCode } from "../../utils/util";
import { useSessionDetailsQuery } from "../../utils/lecternApi";

export default function Join() {
    const router = useRouter();
    // we can also do [...code] to match all (*/)*[code], which will return a string[]
    // however, since we only have 1 arg, this will be a single string
    const { code } = router.query as { code?: string };

    let [enteredName, setEnteredName] = useState(false);
    let [isAnon, setIsAnon] = useState(false);

    const [displayName, setDisplayName] = useState("");

    /* Since this component does represent a possible route in the app, we have to consider that
     * the user has entered an invalid session code by entering it in the URL, even though there
     * are checks on the join form. */
    let isValidCode = validateSessionCode(code);

    const { getData, fetching, errors } = useSessionDetailsQuery({
        variables: { code: code! },
        // don't request with an invalid code
        pause: !isValidCode,
    });

    const dispatch = useAppDispatch();

    if (enteredName) {
        router.push(`/session/${code}`);
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isAnon && displayName.length === 0) return;
        setEnteredName(true);
        dispatch(updateName(displayName));
    };

    let content;

    if (!router.isReady) {
        // sadge: wait till router is ready to not get spurious isValidCode
        // this leaves us an "empty" page but its not toooo bad
        content = <p>Loading url</p>;
    } else if (!isValidCode) {
        content = (
            <div id={styles.container_invalid_code}>
                <h2>
                    The session code <b>#{code}</b> entered is either invalid or expired.
                </h2>
                <h2>Please double check it is the correct code.</h2>
                <Link href="/">
                    <a>Back to home</a>
                </Link>
            </div>
        );
    } else if (fetching) {
        content = (
            <div className="container_center">
                <p>Loading sessions</p>
            </div>
        );
    } else if (errors.length !== 0) {
        let errorMsg = errors.map((e) => e.toString()).join(" ");
        content = (
            <div id={styles.container_invalid_code}>
                <h2>
                    The session with code <b>#{code}</b> could not be accessed.
                </h2>
                <h2>Please double check it is the correct code.</h2>
                <p>Error message: {errorMsg}</p>
                <Link href="/">
                    <a>Back to home.</a>
                </Link>
            </div>
        );
    } else {
        let session = getData();
        dispatch(updateSession(session));
        const nameSection = enteredName ? (
            <></>
        ) : (
            <form className="container_center" id={styles.form_join} onSubmit={handleSubmit}>
                <div id={styles.container_submit}>
                    <button
                        className={`btn btn_secondary ${styles.btn_submit}`}
                        id={styles.btn_submit_anon}
                        type="submit"
                        onClick={() => setIsAnon(true)}
                    >
                        Continue anonymously
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
                    <div id={styles.submit_separator}>
                        <hr />
                        <p>or</p>
                        <hr />
                    </div>
                    <div id={styles.container_submit_name}>
                        <div className="container_input_label">
                            <label className="label">Enter your name to be displayed</label>
                            <input
                                className="input"
                                type="text"
                                maxLength={32}
                                onChange={(e) => setDisplayName(e.target.value.trim())}
                            />
                        </div>
                        <button
                            className={`btn btn_secondary ${styles.btn_submit}`}
                            id={styles.btn_submit_name}
                            type="submit"
                        >
                            {displayName.length !== 0 && (
                                <p>
                                    Continue as <span>{displayName}</span>
                                </p>
                            )}
                            {displayName.length === 0 && `Continue with name`}
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
                    </div>
                </div>
            </form>
        );

        content = (
            <div id={styles.container_join}>
                <h2 id={styles.header_enter_session}>
                    About to enter session <span id={styles.code}>{code}</span>
                </h2>
                <h1 id={styles.header_session_title}>{session.name}</h1>
                <div>
                    <div className={styles.profile_container}>
                        <Image
                            alt={"Picture of this session's author"}
                            src={session.author.pic}
                            className={styles.round_corners}
                            width={"64px"}
                            height={"64px"}
                        />
                        <h3>{session.author.name}</h3>
                        <br />
                        <i>{session.author.bio}</i>

                        {enteredName && !isAnon && <p>Joining as &apos;{displayName}&apos;...</p>}
                        {enteredName && isAnon && <p>Joining anonymously...</p>}
                    </div>
                </div>

                {nameSection}
            </div>
        );
    }

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Join {code}</title>
            </Head>
            <Navigation />
            {content}
        </div>
    );
}
