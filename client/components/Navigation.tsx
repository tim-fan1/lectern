import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useClient, useMutation } from "urql";
import favicon from "../public/favicon.ico";
import { login, logout, selectIsAuthenticated } from "../state/authSlice";
import { useAppDispatch, useAppSelector } from "../state/hooks";
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
    const dispatch = useAppDispatch();

    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    const [_, gqlLogout] = useMutation(MutationLogout);

    const client = useClient();
    useEffect(() => {
        if (!isAuthenticated) {
            client
                .query(QueryAuthCheck, {})
                .toPromise()
                .then((result) => {
                    if (result.error === undefined && result.data.userDetails.errors.length === 0) {
                        dispatch(login());
                    }
                });
        }
    }, [client, isAuthenticated, dispatch]);

    const handleLogout = () => {
        gqlLogout({}).then((result) => {
            if (result.data.logout.errors.length === 0) {
                router.push("/");
                dispatch(logout());
            } else {
                console.error("Could not logout.");
            }
        });
    };

    return (
        <div id={styles.container}>
            <Link href="/" passHref>
                <div id={styles.logo}>
                    <Image src={favicon} alt={"lectern favicon"} width={32} height={32} />
                    <h1>lectern</h1>
                </div>
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
                        <Link href="/instructor/settings">
                            <a>Settings</a>
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
