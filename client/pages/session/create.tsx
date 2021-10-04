import Link from "next/link"
import Navigation from '../../components/Navigation'
import styles from "../../styles/Login.module.css"

export default function SessionCreate() {
    return (
        <div>
            <Navigation />
            <div id={styles.container}>
                <h1>Create a session</h1>
            </div>
        </div>
    )
}
