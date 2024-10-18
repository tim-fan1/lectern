import Link from "next/link";
import styles from "../styles/BackToDashboard.module.css";

export default function BackToDashboard() {
    return (
        <Link href={"/instructor/dashboard"} passHref>
            <div className={styles.center_vertical}>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.arrow}
                >
                    <path
                        d="M10.9998 21.667L12.8798 19.787L5.43984 12.3337L21.6665 12.3337L21.6665 9.66699L5.43984 9.66699L12.8798 2.21366L10.9998 0.333659L0.333173 11.0003L10.9998 21.667Z"
                        fill="white"
                    />
                </svg>
                <a className={styles.link}>Back to dashboard</a>
            </div>
        </Link>
    );
}
