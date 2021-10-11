import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useQuery } from "urql";

const QuerySession = `
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
            }
        }
    }
`;

export default function Dashboard() {
    const [result, reexecuteQuery] = useQuery({ query: QuerySession });

    const { data, fetching, error } = result;

    return (
        <div className="container_center">
            <Navigation />
            <Link href="/instructor/create">
                <a className="btn btn_primary">Create session</a>
            </Link>
            <h1>Instructor dashboard</h1>
            {!fetching ? <p>done fetching {JSON.stringify(data)}</p> : <p>fetching</p>}
            <h3>Prepared sessions (not yet active)</h3>
            <h3>Currently active sessions</h3>
            <h3>Closed sessions</h3>
        </div>
    );
}
