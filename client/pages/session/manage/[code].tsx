import { useRouter } from "next/router";
import Head from "next/head";
import Navigation from "../../../components/Navigation";
export default function SessionManage() {
    const router = useRouter();
    const code = router.query.code;
    return (
        <div>
            <Head>
                <title>lectern - Managing #{code}</title>
            </Head>
            <Navigation />
            <div className="container_center">
                <h1>Managing session with code #{code}!</h1>
                <p>
                    The instructor will be able to start, close, and present the results of the
                    activities they have created
                </p>
            </div>
        </div>
    );
}
