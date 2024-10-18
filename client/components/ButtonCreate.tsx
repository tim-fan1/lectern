import Link from "next/link";
import styles from "../styles/ButtonCreate.module.css";

interface Props {
    href: string;
    text: string;
}

export default function ButtonCreate({ href, text }: Props) {
    return (
        <Link href={href} passHref>
            <a id={styles.btn_create} className="btn btn_primary">
                <p>{text}</p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#000000"
                >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
            </a>
        </Link>
    );
}
