import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../components/Navigation";
import MessageBox from "../components/MessageBox";
import InputPassword from "../components/InputPassword";
import styles from "../styles/register.module.css";

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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [registerSuccess, setRegisterSuccess] = useState(false);

    const [errors, setErrors] = useState([] as string[]);

    const [_, register] = useMutation(MutationRegister);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== passwordConfirm) {
            setErrors(["Passwords are not equal!"]);
            return;
        } else {
            setErrors([]);
        }

        const variables = {
            email: email,
            fname: firstName,
            lname: lastName,
            password: password,
        };
        register(variables).then((result) => {
            if (result.data.register.errors.length === 0) {
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
                <title>lectern - Register</title>
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
                            <label className="label">First Name</label>
                            <input
                                className="input"
                                type="text"
                                minLength={2}
                                maxLength={26}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label">Last Name</label>
                            <input
                                className="input"
                                type="text"
                                minLength={2}
                                maxLength={26}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label">Email</label>
                            <input
                                className="input"
                                id="email"
                                type="email"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="container_input_label">
                            <label className="label">Password</label>
                            <p id={styles.password_requirement}>
                                Your password should be between 8 and 30 characters
                            </p>
                            <InputPassword value={password} setValue={setPassword} />
                        </div>
                        <div className="container_input_label">
                            <label className="label">Confirm password</label>
                            <InputPassword value={passwordConfirm} setValue={setPasswordConfirm} />
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
                    <MessageBox>
                        <h2>You&apos;ve registered!</h2>
                        <p>
                            Please check the email we sent to <b>{email}</b> to verify your account
                            before logging in.
                        </p>
                        <Link href="/login">
                            <a>Click here to login</a>
                        </Link>
                    </MessageBox>
                )}
            </div>
        </div>
    );
}
