import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../components/Navigation";
import styles from "../styles/login.module.css";

const MutationLogin = `
    mutation ($usernameOrEmail: String!, $password: String!) {
        login(usernameOrEmail: $usernameOrEmail, password: $password) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [_, login] = useMutation(MutationLogin);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            usernameOrEmail: email,
            password: password,
        };
        login(variables).then((result) => {
            if (result.data.login.errors.length == 0) {
                router.push("/instructor/dashboard");
            } else {
                setErrorMessage("Incorrect email or password.");
            }
        });
    };

    return (
        <div>
            <Navigation />
            <div className="container_center">
                <h1>Instructor log in</h1>
                {errorMessage && <p className="error">{errorMessage}</p>}
                <form className="form" onSubmit={handleSubmit}>
                    <div className="container_input_label">
                        <label className="label">Email</label>
                        <input
                            className="input"
                            type="email"
                            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                    <div className="container_input_label">
                        <label className="label">Password</label>
                        <input
                            className="input"
                            type="password"
                            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                    <button className="btn btn_primary" type="submit">
                        Log in
                    </button>
                    <div id={styles.helper_links}>
                        <Link href="/">
                            <a>Forgot password?</a>
                        </Link>
                        <Link href="/loginSuccess">
                            <a>Don&apos;t have an account?</a>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
