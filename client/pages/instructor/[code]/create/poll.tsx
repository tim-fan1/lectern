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

const MutationPollAddChoice = `
    mutation ($sessionId: Int!, $activityId: Int!, $name: String!) {
        addChoice(sessionId: $sessionId, activityId: $activityId, name: $name) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function CreatePoll() {
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

    const [errors, setErrors] = useState([] as string[]);

    // TODO: this is not a good way to do this.
    const [name, setName] = useState("");
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [optionC, setOptionC] = useState("");
    const [optionD, setOptionD] = useState("");

    const [createActivityResult, createActivity] = useMutation(MutationCreateActivity);
    const [addChoiceResult, addChoice] = useMutation(MutationPollAddChoice);

    const addChoiceMutation = (activityId: number, name: string) => {
        const variables = {
            sessionId: sessionId,
            activityId: activityId,
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
            sessionId: sessionId,
            name: name,
            kind: "POLL",
        };

        createActivity(variables).then((result) => {
            if (result.data.createActivity.errors.length === 0) {
                const activityId: number = result.data.createActivity.activity.id;
                // TODO: change this to be unlimited tm options.
                if (optionA.length !== 0) addChoiceMutation(activityId, optionA);
                if (optionB.length !== 0) addChoiceMutation(activityId, optionB);
                if (optionC.length !== 0) addChoiceMutation(activityId, optionC);
                if (optionD.length !== 0) addChoiceMutation(activityId, optionD);

                router.push(`/instructor/${code}`);
            } else {
                //error
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
                    placeholder="What do you want to ask?"
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
