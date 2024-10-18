import Link from "next/link";
import styles from "../styles/LecternLogo.module.css";
import favicon from "../public/favicon.ico";
import Image from "next/image";

export default function LecternLogo({ ...props }) {
    return (
        <Link href="/" passHref {...props}>
            <a id={styles.logo}>
                <Image src={favicon} alt={"lectern favicon"} width={32} height={32} />
                <h1>lectern</h1>
            </a>
        </Link>
    );
}
