import Head from "next/head";
import { useRouter } from "next/router";
import React, { FormEvent, useState } from "react";
import { useMutation, useQuery } from "urql";
import Navigation from "../../../../components/Navigation";
import { InputChoice } from "../../../../entities/Choice";
import styles from "../../../../styles/createPoll.module.css";
import CreateActivity from "../../../../components/CreateActivity";
import Activity from "../../../../entities/Activity";

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

const MutationPollAddChoices = `
    mutation ($sessionId: Int!, $activityId: Int!, $choices: [InputChoice!]!) {
        addChoices(sessionId: $sessionId, activityId: $activityId, choices: $choices) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function CreateQA() {
    const router = useRouter();
    const code = router.query.code;

    const [errors, setErrors] = useState([] as string[]);

    const handleSubmit = async (sessionId: number) => {
        // you can use setErrors and LecternCheckForError() on the mutation result
        await router.push(`/instructor/${code}`);
    };

    return (
        <CreateActivity
            pageTitle={"Lectern - QA"}
            title={"Create a Q&A"}
            handleSubmit={handleSubmit}
            activityType={"QA"}
            errors={errors}
            nameInputPlaceholder={"Q&A name"}
            submitText={"Save Q&A"}
        />
    );
}
