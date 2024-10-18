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

// in milliseconds, how long before redirecting after verification succeeds
const REDIRECT_TIME = 2000;

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
                    setMessage(
                        "You've been verified!\nClick on login if you are not redirected within 5 seconds"
                    );
                    setTimeout(async () => {
                        await router.push("/login");
                    }, REDIRECT_TIME);
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
