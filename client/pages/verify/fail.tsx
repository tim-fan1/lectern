import Navigation from "../../components/Navigation";
import styles from "../../styles/Register.module.css";

export default function VerifyFail() {
    return (
        <div>
            <Navigation />
            <div id={styles.container_register_success}>
                <h2>Invalid verification code</h2>
            </div>
        </div>
    );
}
