import Link from "next/link";
import Navigation from "../../components/Navigation";

export default function Dashboard() {
    return (
        <div className="container_center">
            <Navigation />
            <Link href="/instructor/create">
                <a className="btn btn_primary">Create session</a>
            </Link>
            <h1>Instructor dashboard</h1>
            <h3>Prepared sessions (not yet active)</h3>
            <h3>Currently active sessions</h3>
            <h3>Closed sessions</h3>
        </div>
    );
}
