import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import Navigation from "../components/Navigation";
import styles from "../styles/Register.module.css";

const MutationRegister = `
    mutation ($email: String!, $username: String!, $password: String!) {
        register(email: $email, username: $username, password: $password) {
            success
            msg
        }
    }
`;

// TODO: this should be a class         nocheckin
export default function Register() {
    /* TODO: Find a better way to manage this state? */
    /* TODO: check confirmPassword and password are equal */
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerSuccess, setRegsiterSuccess] = useState(false);

    const [_, register] = useMutation(MutationRegister);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // TODO: enforce constraints on name, email, passwords etc

        const variables = {
            email: email,
            username: name,
            password: password,
        };
        register(variables).then((result) => {
            console.log(result.data);
            if (result.data.register.success) {
                setRegsiterSuccess(true);
            }
        });
    };

    return (
        <div>
            <Navigation />
            <div className="container_center">
                <h1>Register an instructor account</h1>
                {!registerSuccess && (
                    <form className="form" onSubmit={handleSubmit}>
                        <div className="container_input_label">
                            <label className="label" htmlFor="">
                                Name
                            </label>
                            <input
                                className="input"
                                type="text"
                                onChange={(e) =>
                                    setName(
                                        (e.target as HTMLInputElement).value
                                    )
                                }
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
                                onChange={(e) =>
                                    setEmail(
                                        (e.target as HTMLInputElement).value
                                    )
                                }
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
                                onChange={(e) =>
                                    setPassword(
                                        (e.target as HTMLInputElement).value
                                    )
                                }
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
                                onChange={(e) =>
                                    setConfirmPassword(
                                        (e.target as HTMLInputElement).value
                                    )
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
                        <h2>You've registered!</h2>
                        {/* TODO: this login message is simply temporary until email verification is implemented. */}
                        <Link href="/login">
                            <a>Click here to login</a>
                        </Link>
                        {/* <p>
                            Please check the email we sent to <b>{email}</b> to
                            verify your account before logging in.
                        </p> */}
                    </div>
                )}
            </div>
        </div>
    );
}
