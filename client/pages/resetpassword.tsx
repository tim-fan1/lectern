import Head from "next/head";
import Navigation from "../components/Navigation";

export default function ResetPassword() {
    return (
        <div className="container_center">
            <Head>
                <title>lectern - Reset password</title>
            </Head>
            <Navigation />
            <h1>Reset your password</h1>
        </div>
    );
}
