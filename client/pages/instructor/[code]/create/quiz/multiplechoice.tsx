import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../../../../components/Navigation";
import styles from "../../../../../styles/createPoll.module.css";
import { useQuery, useMutation } from "urql";
import { InputChoice } from "../../../../../entities/Choice";
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

const MutationAddChoices = `
    mutation ($sessionId: Int!, $activityId: Int!, $choices: [InputChoice!]!) {
        addChoices(sessionId: $sessionId, activityId: $activityId, choices: $choices) {
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
    const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
    const [nAnswers, setNAnswers] = useState(1);
    const [errors, setErrors] = useState([] as string[]);
    const [createActivityResult, createActivity] = useMutation(MutationCreateActivity);
    const [addChoicesResult, addChoices] = useMutation(MutationAddChoices);
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const variables = {
            sessionId: sessionId,
            name: name,
            kind: "QUIZ",
        };
        createActivity(variables).then((result) => {
            if (result.data.createActivity.errors.length === 0) {
                const activityId: number = result.data.createActivity.activity.id;
                let choices: InputChoice[] = [];
                // array.entries() didn't work so i didn't bother.
                let i = 0;
                for (const option of options) {
                    choices.push({
                        name: option,
                        QuizIsCorrect: correctOptionIndex === i,
                    });
                    i++;
                }
                addChoicesMutation(activityId, choices);
            } else {
                setErrors([result.data.createActivity.errors[0].msg]);
            }
        });
    }
    function addChoicesMutation(activityId: number, choices: InputChoice[]) {
        const variables = {
            sessionId: sessionId,
            activityId: activityId,
            choices: choices,
        };
        addChoices(variables).then(() => {
            router.push(`/instructor/${code}`);
        });
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
            <h2 style={{ marginBottom: "2rem" }}>Click a possible answer to mark it as correct</h2>
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
                <div id={styles.container_input_poll_option} style={{ marginBottom: "1rem" }}></div>
                {[...Array(nAnswers)].map((val, i) => {
                    return (
                        <div
                            key={i}
                            id={styles.container_input_label_poll_option}
                            style={{ marginBottom: "1rem" }}
                        >
                            <label>({i + 1})</label>
                            <textarea
                                // type="text"
                                style={{
                                    fontFamily: "sans-serif",
                                    cursor: "pointer",
                                    border: i === correctOptionIndex ? "#2ecc71 5px solid" : "",
                                }}
                                placeholder="Insert possible answer here"
                                className={`input ${styles.input_poll_option}`}
                                onChange={(e) => updateOptions(i, e.target.value)}
                                required
                                onClick={() => setCorrectOptionIndex(i)}
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
                    <button
                        className="btn btn_secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            router.back();
                        }}
                    >
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
