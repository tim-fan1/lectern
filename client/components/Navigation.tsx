import Link from "next/link"
import styles from "../styles/Navigation.module.css"

export default function Navigation() {
    return (
        <div id={styles.container}>
            <Link href="/"><h1 id={styles.logo}>lectern?</h1></Link>
            <div id={styles.links}>
                <Link href="/login"><a>Login</a></Link>
                <Link href="/register"><a>Register</a></Link>
            </div>
        </div>
    )
}
