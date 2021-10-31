import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Navigation from "../../../components/Navigation";
import styles from "../../../styles/edit.module.css";
export default function SessionEdit() {
    const router = useRouter();
    /* The id of the session we are editing. */
    const { id } = router.query;
    const [errors, setErrors] = useState([] as string[]);
    const [name, setName] = useState("");
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);
        console.log("hello!");
    };
    return (
        <div>
            <Head>
                <title>lectern - Editing Session #{id}</title>
            </Head>
            <Navigation />
            <div className="container_center">
                <Link href="/instructor/dashboard">
                    <a className="btn btn_primary">Return to dashboard</a>
                </Link>
                <h2>Editing session #{id}</h2>
                {errors.map((error, i) => (
                    <p className="error" key={i}>
                        {error}
                    </p>
                ))}
                <br />
                <form className="form" onSubmit={handleSubmit}>
                    <div className="container_input_label">
                        <label className="label">New session name</label>
                        <input
                            className="input"
                            type="name"
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
