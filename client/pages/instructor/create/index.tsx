import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";
import Navigation from "../../../components/Navigation";
import styles from "../../../styles/create.module.css";

const MutationSession = `
    mutation ($group: String, $name: String!) {
        createSession(group: $group, name: $name) {
            errors {
                kind,
                msg
            }
            session {
                created,
                id,
                name,
                startTime,
            }
        }
    }
`;

const QueryGroups = `
query {
    getGroups {
        errors {
            kind,
            msg
        }
        groups
    }
}
`;

export default function Dashboard() {
    const router = useRouter();
    const [_, createSession] = useMutation(MutationSession);

    const [name, setName] = useState("");

    const [errors, setErrors] = useState([] as string[]);
    const [selectedButton, setSelectedButton] = useState(undefined as string | undefined);

    const [result] = useQuery({ query: QueryGroups });
    const { data, fetching, error } = result;
    let groups = [] as string[];
    if (!fetching) {
        if (data.getGroups.errors.length !== 0 || error) {
            groups = ["error while fetching groups"]; // bodge haha
        } else {
            groups = data.getGroups.groups;
            if (groups === null) {
                // theoretically, we should never reach here
                // since the backend never returns a null on non errors
                groups = [];
            }
        }
    }
    const addNewGroupInput = useRef<HTMLInputElement>(null);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const variables = {
            // dont specify group if empty string is specified
            group: selectedButton !== "" ? selectedButton : undefined,
            name: name,
        };
        createSession(variables).then((result) => {
            if (result.data.createSession.errors.length === 0) {
                router.push("/instructor/dashboard");
            } else {
                const errorMessages = result.data.createSession.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div className="container_center">
            <Head>
                <title>lectern - Create session</title>
            </Head>
            <Navigation />
            <h2>Create a new session</h2>
            <form className="form" onSubmit={handleSubmit}>
                <div className="container_input_label">
                    <label className="label">Session name</label>
                    <input
                        className="input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="container_center">
                    <p>Add this session to a group (optional)</p>
                    <div className={styles.container_add_group}>
                        {groups.map((groupName, i) => {
                            let className = `btn btn_secondary ${styles.group_button}`;
                            if (groupName === selectedButton) {
                                className += ` ${styles.group_selected_button}`;
                            }
                            return (
                                <input
                                    className={className}
                                    type="button"
                                    key={i}
                                    value={groupName}
                                    onClick={() => {
                                        if (selectedButton === groupName) {
                                            // unset it
                                            setSelectedButton(undefined);
                                        } else {
                                            setSelectedButton(groupName);
                                            // input element shouldn't be null
                                            // kludge - this doesnt trigger onChange
                                            // so we need to manually set it
                                            addNewGroupInput.current!.value = "";
                                            addNewGroupInput.current!.className =
                                                "btn btn_secondary";
                                        }
                                    }}
                                />
                            );
                        })}
                        <div>
                            <input
                                id={styles.add_new_group_input}
                                ref={addNewGroupInput}
                                className="btn btn_secondary"
                                placeholder="Create a new group +"
                                onChange={(e) => {
                                    if (e.target.value === "") {
                                        e.target.className = `btn btn_secondary`;
                                    } else {
                                        e.target.className = `btn btn_secondary ${styles.group_selected_button}`;
                                        setSelectedButton(e.target.value);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div id={styles.container_btn}>
                    <Link href="/instructor/dashboard" passHref>
                        <button className="btn btn_secondary">Cancel</button>
                    </Link>
                    <button className="btn btn_primary">Create session</button>
                </div>
            </form>
            {errors.map((error, i) => (
                <div key={i}>
                    <p>Could not create session.</p>
                    <p className="error">{error}</p>
                </div>
            ))}
        </div>
    );
}
