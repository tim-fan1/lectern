import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "urql";
import MessageBox from "../../components/MessageBox";
import Navigation from "../../components/Navigation";

const MutationVerifyEmail = `
    mutation ($verification_code: String!) {
        verifyEmail(verificationCode: $verification_code) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function VerifyEmail() {
    const router = useRouter();
    const [_, gqlVerifyEmail] = useMutation(MutationVerifyEmail);

    const [message, setMessage] = useState("");
    useEffect(() => {
        if (router.isReady) {
            const variables = {
                verification_code: `${router.query.code}`,
            };
            gqlVerifyEmail(variables).then((result) => {
                if (result.data.verifyEmail.errors.length === 0) {
                    setMessage("You've been verified!");
                } else {
                    setMessage("Unfortunately, we could not verify your email.");
                }
            });
        }
    }, [router, router.isReady, gqlVerifyEmail]);

    return (
        <div>
            <Head>
                <title>lectern - Verify email</title>
            </Head>
            <Navigation />
            <MessageBox>
                <h1>Hi, we are verifying your account now...</h1>
                <h2>{message}</h2>
            </MessageBox>
        </div>
    );
}
