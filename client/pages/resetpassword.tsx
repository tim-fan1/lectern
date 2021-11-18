import Head from "next/head";
import { useRouter } from "next/router";
import React, { FormEvent, useEffect, useState } from "react";
import { useMutation } from "urql";
import MessageBox from "../components/MessageBox";
import Navigation from "../components/Navigation";
import { selectIsAuthenticated } from "../state/authSlice";
import { useAppDispatch, useAppSelector } from "../state/hooks";

const MutationReset = `
    mutation ($email: String!) {
    requestReset(email: $email) {
        errors {
        kind,
        msg
        }
    }
    }
`;

export default function ResetPassword() {
    const [_, gqlReset] = useMutation(MutationReset);

    const router = useRouter();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    useEffect(() => {
        /* If someone is already authenticated and they arrive at the reset password route, we
         * redirect them to the dashboard page. */
        if (isAuthenticated) {
            router.push("/instructor/dashboard");
        }
    }, [router, router.isReady, isAuthenticated]);

    const [email, setEmail] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            email: email,
        };
        gqlReset(variables).then((result) => {
            if (result.data.requestReset.errors.length === 0) {
                setResetSuccess(true);
            }

            // request reset by design does not return any errors
        });
    };

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Request password reset</title>
            </Head>
            <Navigation />
            {!resetSuccess ? (
                <>
                    <h1>Reset your password</h1>
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="container_input_label">
                            <label className="label">Email</label>
                            <input
                                className="input"
                                type="email"
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button className="btn btn_primary" type="submit">
                            Request password reset
                        </button>
                    </form>
                </>
            ) : (
                <MessageBox>
                    <h2>Password reset requested</h2>
                    <p>Please check your email to reset your password.</p>
                </MessageBox>
            )}
        </div>
    );
}
