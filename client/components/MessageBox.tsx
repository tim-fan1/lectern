/* This component is basically used whenever we want a general box with some messages/links in it
 * to display to the user. Usually as a confirmation or telling them to take some action before they
 * proceed. E.g. register success or verify email success. */
import styles from "../styles/MessageBox.module.css";

interface Props {
    children: React.ReactNode;
}

export default function MessageBox({ children }: Props) {
    return <div className={styles.container}>{children}</div>;
}
