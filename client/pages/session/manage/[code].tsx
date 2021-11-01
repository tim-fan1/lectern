import { useRouter } from "next/router";
import Head from "next/head";
import Navigation from "../../../components/Navigation";
import { useQuery } from "urql";
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
                <h1>{session.name}</h1>
                <p>
                    The instructor will be able to start, close, and present the results of the
                    activities they have created
                </p>
                <p>
                    Session Code: <span>{code}</span>
                </p>
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
