import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useQuery } from "urql";
import CardSession from "../../components/CardSession";

const QueryGetSessions = `
    query {
        getSessions {
            errors {
                kind,
                msg
            }
            sessions {
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
    id: string;
    name: string;
    startedTime: string;
};

export default function Dashboard() {
    const [result] = useQuery({ query: QueryGetSessions });

    const { data, fetching, error } = result;
    // TODO: error handling, use https://www.npmjs.com/package/next-urql with getServerSideProps

    return (
        <div className="container_center">
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
                    />
                ))}
        </div>
    );
}
