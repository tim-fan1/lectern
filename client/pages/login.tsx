import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "urql";
import InputPassword from "../components/InputPassword";
import Navigation from "../components/Navigation";
import { login, selectIsAuthenticated } from "../state/authSlice";
import { useAppDispatch, useAppSelector } from "../state/hooks";
import styles from "../styles/login.module.css";

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
    const dispatch = useAppDispatch();

    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    useEffect(() => {
        /* If someone is already authenticated and they arrive at the login route, we
         * redirect them to the dashboard page. */
        if (isAuthenticated) {
            router.push("/instructor/dashboard");
        }
    }, [router, router.isReady, isAuthenticated]);

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
            if (result.data.login.errors.length === 0) {
                router.push("/instructor/dashboard");
                dispatch(login());
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
                <title>lectern - Login</title>
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
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="container_input_label">
                        <label className="label">Password</label>
                        <InputPassword value={password} setValue={setPassword} />
                    </div>
                    <button className="btn btn_primary" type="submit">
                        Log in
                    </button>
                    <div id={styles.helper_links}>
                        <Link href="/resetpassword">
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
