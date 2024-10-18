import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FormEvent, useState } from "react";
import { useMutation } from "urql";
import InputPassword from "../../components/InputPassword";
import MessageBox from "../../components/MessageBox";
import Navigation from "../../components/Navigation";

const MutationPasswordReset = `
    mutation ($code: String!, $newPassword: String!) {
        passwordReset(code: $code, newPassword: $newPassword) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function VerifyEmail() {
    const router = useRouter();
    const { code } = router.query;
    const [_, gqlPasswordReset] = useMutation(MutationPasswordReset);

    const [resetSuccess, setResetSuccess] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [errors, setErrors] = useState([] as string[]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);
        if (password !== passwordConfirm) {
            setErrors(["New password and new password confirm do not match"]);
            return;
        }
        const variables = {
            code: code,
            newPassword: password,
        };
        gqlPasswordReset(variables).then((result) => {
            if (result.data.passwordReset.errors.length === 0) {
                setResetSuccess(true);
            } else {
                const errorMessages = result.data.passwordReset.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Change password</title>
            </Head>
            <Navigation />
            {!resetSuccess ? (
                <>
                    <h1>Change your password</h1>
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="container_input_label">
                            <label className="label">New password</label>
                            <InputPassword value={password} setValue={setPassword} />
                        </div>
                        <div className="container_input_label">
                            <label className="label">Confirm new password</label>
                            <InputPassword value={passwordConfirm} setValue={setPasswordConfirm} />
                        </div>
                        <button className="btn btn_primary" type="submit">
                            Change password
                        </button>
                        {errors.map((error, i) => (
                            <p className="error" key={i}>
                                {error}
                            </p>
                        ))}
                    </form>
                </>
            ) : (
                <MessageBox>
                    <h2>Password changed</h2>
                    <Link href="/login">
                        <a>Click here to login</a>
                    </Link>
                </MessageBox>
            )}
        </div>
    );
}
