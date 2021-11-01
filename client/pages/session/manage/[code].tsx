import { useRouter } from "next/router";
import Head from "next/head";
import Navigation from "../../../components/Navigation";
import { useQuery } from "urql";
import styles from "../../../styles/manage.module.css";

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session {
                id,
                created,
                updated,
                state,
                startTime,
                endTime,
                group,
                name,
                code
            }
            errors {
                kind
                msg
            }
        }
    }
`;

interface QueriedSession {
    id: number;
    created: Date;
    updated: Date;
    state: String;
    startTime?: Date;
    endTime?: Date;
    group: String;
    name: String;
    code?: String;
}

export default function SessionManage() {
    const router = useRouter();
    const code = router.query.code;

    const gotoDashboard = () => {
        router.push("/instructor/dashboard");
    };

    const [result] = useQuery({ query: QuerySessionDetails, variables: { code } });
    let { data, fetching } = result;
    let content;
    if (fetching) {
        content = <p>I&apos;m reloading</p>;
    } else if (data.sessionDetails.errors.length !== 0) {
        // error happened - maybe no auth?
        console.log("error?", result.data.sessionDetails);
        content = <p>An error happened! {result.data.sessionDetails.errors.toString()}</p>;
    } else {
        let session: QueriedSession = result.data.sessionDetails.session;
        content = (
            <>
                <div className={styles.topInfo}>
                    <div onClick={gotoDashboard}>
                        <p>&lt;- Go to dashboard</p>
                    </div>
                    <div className="container_center">
                        <h2>{session.name}</h2>
                        <p>
                            Session Code: <span className={styles.session_code}>{code}</span>
                        </p>
                    </div>
                    <button className="btn btn_primary">CLose session (/)</button>
                </div>
                <button className="btn btn_primary">Present session</button>
            </>
        );
    }
    return (
        <div>
            <Head>
                <title>lectern - Managing #{code}</title>
            </Head>
            <Navigation />
            <div className="container_center">{content}</div>
        </div>
    );
}
