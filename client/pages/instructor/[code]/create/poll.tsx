import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "urql";
import Navigation from "../../../../components/Navigation";
import styles from "../../../../styles/createPoll.module.css";

// TODO: this whole page is a mess and needs to be revisited.

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
    mutation ($session_id: String!, $name: String!, $kind: String!) {
        createActivity(session_id: $session_id, name: $name, kind: $kind) {
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

const MutationPollAddChoice = `
    mutation ($session_id: String!, $activity_id: String!, $name: String!) {
        addChoice(session_id: $session_id, activity_id: $activity_id, name: $name) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function CreatePoll() {
    const router = useRouter();
    const [result] = useQuery({
        query: QuerySessionDetails,
        variables: { code: router.query.code },
    });

    let session_id: string;
    if (!result.fetching) {
        session_id = result.data.sessionDetails.session.id.toString();
    }

    const [errors, setErrors] = useState([] as string[]);

    // TODO: this is not a good way to do this.
    const [name, setName] = useState("");
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [optionC, setOptionC] = useState("");
    const [optionD, setOptionD] = useState("");

    const [createActivityResult, createActivity] = useMutation(MutationCreateActivity);
    const [addChoiceResult, addChoice] = useMutation(MutationPollAddChoice);

    const addChoiceMutation = (activity_id: string, name: string) => {
        const variables = {
            session_id: session_id,
            activity_id: activity_id,
            name: name,
        };
        addChoice(variables).then((result) => {
            if (result.data.addChoice.errors.length !== 0) {
                console.log(result);
            }
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            session_id: session_id,
            name: name,
            kind: "POLL",
        };

        createActivity(variables).then((result) => {
            if (result.data.createActivity.errors.length === 0) {
                const activity_id: string = result.data.createActivity.activity.id.toString();

                if (optionA.length !== 0) addChoiceMutation(activity_id, optionA);
                if (optionB.length !== 0) addChoiceMutation(activity_id, optionB);
                if (optionC.length !== 0) addChoiceMutation(activity_id, optionC);
                if (optionD.length !== 0) addChoiceMutation(activity_id, optionD);
            } else {
                console.log(result);
            }
        });
    };

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
                            onChange={(e) => setOptionA(e.target.value)}
                            required
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(b)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                            onChange={(e) => setOptionB(e.target.value)}
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(c)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                            onChange={(e) => setOptionC(e.target.value)}
                        />
                    </div>
                    <div id={styles.container_input_label_poll_option}>
                        <label>(d)</label>
                        <input
                            type="text"
                            placeholder="Add option"
                            className={`input ${styles.input_poll_option}`}
                            onChange={(e) => setOptionD(e.target.value)}
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
