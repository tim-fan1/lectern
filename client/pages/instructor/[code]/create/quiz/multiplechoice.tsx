import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../../../../components/Navigation";
import styles from "../../../../../styles/createPoll.module.css";
import { useQuery, useMutation } from "urql";
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

const MutationCreateActivity = `
    mutation ($sessionId: Int!, $name: String!, $kind: String!) {
        createActivity(sessionId: $sessionId, name: $name, kind: $kind) {
            activity {
                id
            }
            errors {
                kind
                msg
            }
        }
    }
`;

const MutationAddChoice = `
    mutation ($sessionId: Int!, $activityId: Int!, $name: String!) {
        addChoice(sessionId: $sessionId, activityId: $activityId, name: $name) {
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
    const [errors, setErrors] = useState([] as string[]);
    const [createActivityResult, createActivity] = useMutation(MutationCreateActivity);
    const [addChoiceResult, addChoice] = useMutation(MutationAddChoice);
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("submitting multiple choice");
        const variables = {
            sessionId: sessionId,
            name: name,
            kind: "QUIZ",
        };
        createActivity(variables).then((result) => {
            if (result.data.createActivity.errors.length === 0) {
                const activityId: number = result.data.createActivity.activity.id;
                for (const option of options) {
                    addChoiceMutation(activityId, option);
                }
                router.push(`/instructor/${code}`);
            } else {
                setErrors([result.data.createActivity.errors[0].msg]);
            }
        });
    }
    function addChoiceMutation(activityId: number, name: string) {
        const variables = {
            sessionId: sessionId,
            activityId: activityId,
            name: name,
        };
        addChoice(variables);
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
                {errors.map((error, i) => (
                    <p key={i} className="error">
                        {error}
                    </p>
                ))}
            </form>
        </div>
    );
}
