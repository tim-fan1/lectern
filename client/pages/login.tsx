import Link from "next/link"
import Navigation from '../components/Navigation'
import styles from "../styles/Login.module.css"
import formStyles from "../styles/Form.module.css"

export default function Login() {
    return (
        <div>
            <Navigation />
            <div className={formStyles.form_container}>
                <h1>Instructor log in</h1>
                <form className={formStyles.form}>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">Email</label>
                        <input className={formStyles.input} type="email" />
                    </div>
                    <div className={formStyles.input_container}>
                        <label className={formStyles.label} htmlFor="">Password</label>
                        <input className={formStyles.input} type="password" />
                    </div>
                    <button className={formStyles.btn_submit} type="submit">Log in</button>
                    <div id={styles.helper_links}>
                        <Link href="/"><a>Forgot password?</a></Link>
                        <Link href="/register"><a>Don&apos;t have an account?</a></Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
