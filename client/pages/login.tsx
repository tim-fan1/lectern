import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import { useAuth } from "../contexts/ContextAuth";
import Navigation from "../components/Navigation";
import styles from "../styles/Login.module.css";

const MutationLogin = `
    mutation ($email: String!, $password: String!) {
        login(email: $email, password: $password) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function Login() {
    const router = useRouter();
    const { isAuthenticated, login, logout } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errors, setErrors] = useState([] as string[]);

    const [_, gqlLogin] = useMutation(MutationLogin);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);

        const variables = {
            email: email,
            password: password,
        };
        gqlLogin(variables).then((result) => {
            // TODO: check if the network request actually succeeded.
            if (result.data.login.errors.length == 0) {
                router.push("/instructor/dashboard");
                login();
            } else {
                const errorMessages = result.data.login.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div>
            <Head>
                <title>lectern - login</title>
            </Head>
            <Navigation />
            <div className="container_center">
                <h1>Instructor log in</h1>
                {errors.map((error, i) => (
                    <p className="error" key={i}>
                        {error}
                    </p>
                ))}
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
                        <Link href="/register">
                            <a>Don&apos;t have an account?</a>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
