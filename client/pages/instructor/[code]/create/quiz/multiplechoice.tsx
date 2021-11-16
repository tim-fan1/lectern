import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../../../../components/Navigation";
import styles from "../../../../../styles/createPoll.module.css";
import { useQuery } from "urql";
const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session {
                id
            }
            errors {
                kind
                msg
            }
        }
    }
`;

export default function CreateMultipleChoiceQuiz() {
    const router = useRouter();
    const code = router.query.code;
    const [result] = useQuery({
        query: QuerySessionDetails,
        variables: { code },
    });

    let sessionId: number;
    if (!result.fetching) {
        sessionId = result.data.sessionDetails.session.id;
    }
    const [name, setName] = useState("");
    const [options, setOptions] = useState([""]);
    const [nAnswers, setNAnswers] = useState(1);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("submitting multiple choice");
        console.log(options);
    }
    function updateOptions(i: number, newOption: string) {
        let optionsCopy = [...options];
        optionsCopy[i] = newOption;
        setOptions(optionsCopy);
    }
    return (
        <div className="container_center">
            <Head>
                <title>lectern - Create a multiple choice quiz</title>
            </Head>
            <Navigation />
            <h1>Create a multiple choice quiz</h1>
            <form className="form" onSubmit={handleSubmit}>
                <input
                    id={styles.input_poll_name}
                    type="text"
                    className="input"
                    placeholder="What do you want to ask?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <div id={styles.container_input_poll_option} style={{ marginBottom: "1rem" }}>
                    <h3>Multiple choice quiz possible answers</h3>
                </div>
                {[...Array(nAnswers)].map((val, i) => {
                    return (
                        <div
                            key={i}
                            id={styles.container_input_label_poll_option}
                            style={{ marginBottom: "1rem" }}
                        >
                            <label>({i + 1})</label>
                            <input
                                type="text"
                                placeholder="Insert possible answer here"
                                className={`input ${styles.input_poll_option}`}
                                onChange={(e) => updateOptions(i, e.target.value)}
                                required
                            />
                        </div>
                    );
                })}
                <button
                    type="button"
                    className="btn btn_primary"
                    onClick={() => {
                        setNAnswers(nAnswers + 1);
                        setOptions([...options, ""]);
                    }}
                >
                    Add option
                </button>
                <div className="form_container_btn">
                    <button className="btn btn_secondary" onClick={() => router.back()}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn_primary">
                        Add quiz to session
                    </button>
                </div>
            </form>
            {/* {errors.map((error, i) => (
                <p key={i} className="error">
                    {error}
                </p>
            ))} */}
        </div>
    );
}
