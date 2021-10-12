import Link from "next/link";
import { useRouter } from "next/router";
import { useClient, useMutation } from "urql";
import { useAuth } from "../contexts/ContextAuth";
import styles from "../styles/Navigation.module.css";

const QueryAuthCheck = `
    query {
        userDetails {
            errors {
                kind
                msg
            }
        }
    }
`;

const MutationLogout = `
    mutation {
        logout {
            errors {
                kind
                msg
            }
        }
    }
`;

export default function Navigation() {
    const router = useRouter();
    const { isAuthenticated, login, logout } = useAuth();

    const [_, gqlLogout] = useMutation(MutationLogout);

    const client = useClient();
    if (!isAuthenticated) {
        client
            .query(QueryAuthCheck, {})
            .toPromise()
            .then((result) => {
                console.log(result);
                if (result.error === undefined && result.data.userDetails.errors.length === 0) {
                    login();
                }
            });
    }

    const handleLogout = () => {
        gqlLogout({}).then((result) => {
            if (result.data.logout.errors.length == 0) {
                router.push("/");
                logout();
            } else {
                console.error("Could not logout.");
            }
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
