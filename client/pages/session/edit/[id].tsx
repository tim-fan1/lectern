import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Navigation from "../../../components/Navigation";
export default function SessionEdit() {
    const router = useRouter();
    /* The id of the session we are editing. */
    const { id } = router.query;
    return (
        <div>
            <Head>
                <title>lectern - Edit {id}</title>
            </Head>
            <Navigation />
            <div className={`container_center`}>
                <Link href="/instructor/dashboard">
                    <a className="btn btn_primary">
                        <p>Return to dashboard</p>
                    </a>
                </Link>
                <h2>You are editing session with id {id}</h2>
            </div>
        </div>
    );
}
