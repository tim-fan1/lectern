import Link from "next/link";
import Head from "next/head";
import { useQuery } from "urql";
import Navigation from "../../components/Navigation";
import CardSession from "../../components/CardSession";
import { SessionStateString, sessionStateStringToEnum } from "../../util";

const QueryGetSessions = `
    query {
        getSessions {
            errors {
                kind,
                msg
            }
            sessions {
                code,
                created,
                id,
                name,
                startTime,
                state,
            }
        }
    }
`;

type Session = {
    created: string;
    id: number;
    name: string;
    startedTime: string;
    state: SessionStateString;
    code?: string;
};

export default function Dashboard() {
    const [result] = useQuery({ query: QueryGetSessions });

    const { data, fetching, error } = result;
    // TODO: error handling, use https://www.npmjs.com/package/next-urql with getServerSideProps

    return (
        <div className="container_center">
            <Head>
                <title>lectern - instructor dashboard</title>
            </Head>
            <Navigation />
            <Link href="/instructor/create">
                <a className="btn btn_primary">Create session</a>
            </Link>
            <h1>Instructor dashboard</h1>
            <h3>Sessions</h3>
            {!fetching &&
                data.getSessions.sessions.map((session: Session) => (
                    <CardSession
                        key={session.id}
                        timeCreatedUTC={session.created}
                        name={session.name}
                        id={session.id}
                        state={sessionStateStringToEnum(session.state)}
                        code={session.code}
                    />
                ))}
        </div>
    );
}
