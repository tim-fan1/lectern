import Link from "next/link";
import Navigation from "../components/Navigation";
import formStyles from "../styles/Form.module.css";

export default function Register() {
    return (
        <div>
            <Navigation />
            <div className="centered_container">
                <h1>Register an instructor account</h1>
                <form className={formStyles.form}>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">
                            Name
                        </label>
                        <input className={formStyles.input} type="email" />
                    </div>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">
                            Email
                        </label>
                        <input
                            className={formStyles.input}
                            id={formStyles.email}
                            type="email"
                        />
                    </div>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">
                            Password
                        </label>
                        <input
                            className={formStyles.input}
                            id={formStyles.password}
                            type="password"
                        />
                    </div>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">
                            Confirm password
                        </label>
                        <input
                            className={formStyles.input}
                            id={formStyles.password}
                            type="password"
                        />
                    </div>
                    <button className={formStyles.btn_submit} type="submit">
                        Register
                    </button>
                    <Link href="/login">
                        <a>Already have an account?</a>
                    </Link>
                </form>
            </div>
        </div>
    );
}
