import Link from "next/link";
import Head from "next/head";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../components/Navigation";
import styles from "../styles/Register.module.css";

const MutationRegister = `
    mutation ($email: String!, $fname: String!, $lname: String!, $password: String!) {
        register(email: $email, fname: $fname, lname: $lname, password: $password) {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function Register() {
    const [fname, setFirstName] = useState("");
    const [lname, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [registerSuccess, setRegisterSuccess] = useState(false);

    const [errors, setErrors] = useState([] as string[]);

    const [_, register] = useMutation(MutationRegister);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password != passwordConfirm) {
            setErrors(["Passwords are not equal!"]);
            return;
        } else {
            setErrors([]);
        }

        const variables = {
            email: email,
            fname: fname,
            lname: lname,
            password: password,
        };
        register(variables).then((result) => {
            if (result.data.register.errors.length == 0) {
                /* a register success prompt will pop up when this is set to true. */
                setRegisterSuccess(true);
            } else {
                const errorMessages = result.data.register.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div>
            <Head>
                <title>lectern - register</title>
            </Head>
            <Navigation />
            <div className="container_center">
                <h1>Register an instructor account</h1>
                {errors.map((error, i) => (
                    <p className="error" key={i}>
                        {error}
                    </p>
                ))}
                {!registerSuccess && (
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                First Name
                            </label>
                            <input
                                className="input"
                                type="text"
                                minLength={2}
                                maxLength={26}
                                onChange={(e) => setFirstName((e.target as HTMLInputElement).value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                Last Name
                            </label>
                            <input
                                className="input"
                                type="text"
                                minLength={2}
                                maxLength={26}
                                onChange={(e) => setLastName((e.target as HTMLInputElement).value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                Email
                            </label>
                            <input
                                className="input"
                                id="email"
                                type="email"
                                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                Password
                            </label>
                            <input
                                className="input"
                                type="password"
                                minLength={8}
                                maxLength={30}
                                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                Confirm password
                            </label>
                            <input
                                className="input"
                                type="password"
                                minLength={8}
                                maxLength={30}
                                onChange={(e) =>
                                    setPasswordConfirm((e.target as HTMLInputElement).value)
                                }
                                required
                            />
                        </div>
                        <button className="btn btn_primary" type="submit">
                            Register
                        </button>
                        <Link href="/login">
                            <a>Already have an account?</a>
                        </Link>
                    </form>
                )}
                {registerSuccess && (
                    <div id={styles.container_register_success}>
                        <h2>You&apos;ve registered!</h2>
                        {/* TODO: this login message is simply temporary until email verification is implemented. */}
                        <Link href="/login">
                            <a>Click here to login</a>
                        </Link>
                        <p>
                            Please check the email we sent to <b>{email}</b> to verify your account
                            before logging in.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
