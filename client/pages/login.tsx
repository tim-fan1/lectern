import Link from "next/link";
import Navigation from "../components/Navigation";
import styles from "../styles/Login.module.css";

export default function Login() {
    return (
        <div>
            <Navigation />
            <div className="container_center">
                <h1>Instructor log in</h1>
                <form className="form">
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Email
                        </label>
                        <input className="input" type="email" />
                    </div>
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Password
                        </label>
                        <input className="input" type="password" />
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
