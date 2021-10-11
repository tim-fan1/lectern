import Link from "next/link";
import { useRouter } from "next/router";
import { useMutation } from "urql";
import { useAuth } from "../contexts/ContextAuth";
import styles from "../styles/Navigation.module.css";

const MutationLogout = `
    mutation () {
        logout() {}
    }
`;

export default function Navigation() {
    const router = useRouter();
    const { isAuthenticated, login, logout } = useAuth();

    const [_, gqlLogout] = useMutation(MutationLogout);

    const handleLogout = () => {
        gqlLogout({}).then((result) => {
            if (result.data.login.errors.length == 0) {
                router.push("/");
                logout();
            }
            // TODO: error checking
        });
    };

    return (
        <div id={styles.container}>
            <Link href="/" passHref>
                <h1 id={styles.logo}>lectern?</h1>
            </Link>
            <div id={styles.links}>
                {!isAuthenticated && (
                    <div className={styles.container_links_auth}>
                        <Link href="/login">
                            <a>Login</a>
                        </Link>
                        <Link href="/register">
                            <a>Register</a>
                        </Link>
                    </div>
                )}
                {isAuthenticated && (
                    <div className={styles.container_links_auth}>
                        <Link href="/instructor/dashboard">
                            <a>Dashboard</a>
                        </Link>
                        <Link href="/">
                            <a onClick={handleLogout}>Logout</a>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
