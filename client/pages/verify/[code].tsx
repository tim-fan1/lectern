import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMutation } from "urql";
import MessageBox from "../../components/MessageBox";
import Navigation from "../../components/Navigation";

const MutationVerifyEmail = `
    mutation ($verification_code: String!) {
        verify_email(verification_code: $verification_code) {
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

    const [verifyFinished, setVerifyFinished] = useState(false);
    const [verifySuccess, setVerifySuccess] = useState(false);

    useEffect(() => {
        const variables = {
            verification_code: `${router.query.code}`,
        };
        gqlVerifyEmail(variables).then((result) => {
            setVerifyFinished(true);
            if (result.data.verify_email.errors.length == 0) {
                setVerifySuccess(true);
            } else {
                setVerifySuccess(false);
            }
        });
    }, [router, router.isReady, gqlVerifyEmail]);

    return (
        <div>
            <Head>
                <title>lectern - Verify email</title>
            </Head>
            <Navigation />
            <MessageBox>
                <h1>Hi, we are verifying your account now...</h1>
                {verifyFinished && verifySuccess && <h2>You&apos;ve been verified!</h2>}
                {verifyFinished && !verifySuccess && (
                    <h2>Unfortunately, we could not verify your email.</h2>
                )}
            </MessageBox>
        </div>
    );
}
