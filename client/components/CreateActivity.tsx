import Head from "next/head";
import { useRouter } from "next/router";
import React, { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "./Navigation";
import styles from "../styles/CreateActivityTop.module.css";
import { useSessionDetailsQuery } from "../utils/lecternApi";
import Link from "next/link";

export type CreateProps = {
    pageTitle: string; // the <Title>
    title: string; // title in the <h2> element, describing what the page does
    nameInputPlaceholder: string; // placeholder for the <input> element used for page name

    children?: React.ReactNode;
    handleSubmit?: (sessionId: number) => Promise<any>;
    activityType: string;
    errors: string[];

    submitText: string;
};

// shared CreateActivity component
// contains components shared by all 4 create screens, and allows
// each create form to specify <input> options and custom handleSubmit logic
// note that before handleSubmit is run, it will create the activity
// all the subclasses need to do is to add the input options
export default function CreateActivity({
    title,
    pageTitle,
    children,
    handleSubmit,
    activityType,
    errors: passedErrors,
    nameInputPlaceholder,
    submitText,
}: CreateProps) {
    const router = useRouter();
    const code = router.query.code as string;
    const {
        fetching,
        errors: sessionErrors,
        getData,
    } = useSessionDetailsQuery({
        variables: { code },
        pause: !router.isReady,
    });

    const [errors, setErrors] = useState([] as string[]);

    const [name, setName] = useState("");

    let sessionId = -1;
    if (fetching) {
        // dont do anything
    } else if (sessionErrors.length !== 0) {
        setErrors(sessionErrors.map((e) => e.toString()));
    } else {
        sessionId = getData().id;
    }

    return (
        <div className="container_center">
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <Navigation />
            <Link href={"/instructor/dashboard"}>Back to dashboard</Link>
            <h1>{title}</h1>
            <form
                className="form"
                onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    if (handleSubmit) {
                        await handleSubmit(sessionId);
                    }
                }}
            >
                <input
                    id={styles.input_poll_name}
                    type="text"
                    className="input"
                    placeholder={nameInputPlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {children}
                {errors.map((error, i) => (
                    <p key={i} className="error">
                        {error}
                    </p>
                ))}
                <div className="form_container_btn">
                    <button className="btn btn_secondary" onClick={() => router.back()}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn_primary">
                        {submitText}
                    </button>
                </div>
            </form>
        </div>
    );
}
