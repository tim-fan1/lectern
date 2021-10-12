import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../../components/Navigation";
import styles from "../../styles/Register.module.css";

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
    const verification_code = `${router.query.code}`;
    const [errors, setErrors] = useState([] as string[]);
    const [_, gqlVerifyEmail] = useMutation(MutationVerifyEmail);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    const doVerifyEmail = () => {
        setErrors([]);
        const variables = {
            verification_code: verification_code,
        };
        console.log(variables);
        gqlVerifyEmail(variables).then((result) => {
            console.log(result);
            if (result.data.verify_email.errors.length == 0) {
                setVerificationSuccess(true);
            } else {
                router.push("fail");
            }
        });
    };
    return (
        <div>
            <Navigation />
            {/* <div className="container_center">We are verifying your email...</div> */}
            <button onClick={doVerifyEmail}>Click me to verify!</button>
            {verificationSuccess && (
                <div id={styles.container_register_success}>
                    <h2>You&apos;ve been verified!</h2>
                </div>
            )}
        </div>
    );
}
