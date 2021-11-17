import Head from "next/head";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "urql";
import InputPassword from "../../components/InputPassword";
import Navigation from "../../components/Navigation";
import styles from "../../styles/settings.module.css";
import Link from "next/link";
import BackToDashboard from "../../components/BackToDashboard";

const MutationChangePassword = `
    mutation ($password: String!, $newPassword: String!) {
        changePassword(password: $password, newPassword: $newPassword) {
            errors {
                kind
                msg
            }
        }
    }
`;

const QueryUserDetails = `
    query {
    userDetails {
        user {
        name,
        pic,
        bio,
        },
        errors {
        kind,
        msg
        }
    }
    }
`;

const MutationEditUserDetails = `
    mutation ($bio: String!){
        editUserDetails(bio: $bio) {
            errors {
            kind,
            msg
            }
            user {
            name,
            bio,
            pic,
            }
        }
    }
`;

export default function Settings() {
    const [changePasswordResult, changePassword] = useMutation(MutationChangePassword);
    const [editUserDetailsResult, editUserDetails] = useMutation(MutationEditUserDetails);

    const [changePasswordErrors, setChangePasswordErrors] = useState([] as string[]);
    const [changeDetailsErrors, setChangeDetailsErrors] = useState([] as string[]);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

    const [changeDetailsSuccess, setChangeDetailsSuccess] = useState(false);
    const [bio, setBio] = useState("");
    const [result] = useQuery({ query: QueryUserDetails });
    const { data, fetching } = result;

    let changePasswordBtnOrMsg;
    if (changePasswordSuccess) {
        changePasswordBtnOrMsg = <h3>Password successfully changed!</h3>;
    } else {
        changePasswordBtnOrMsg = (
            <button className="btn btn_primary" type="submit">
                Change password
            </button>
        );
    }

    let changeDetailsBtnOrMsg;
    if (changeDetailsSuccess) {
        changeDetailsBtnOrMsg = <h3>Details successfully changed!</h3>;
    } else {
        changeDetailsBtnOrMsg = (
            <button className="btn btn_primary" type="submit">
                Change details
            </button>
        );
    }

    const handleEditUserDetails = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setChangeDetailsErrors([]);

        const variables = {
            bio: bio,
        };
        editUserDetails(variables).then((result) => {
            if (result.data.editUserDetails.errors.length === 0) {
                setChangeDetailsSuccess(true);
                /* We only want to give feedback that the details change has been successful for a certain amount of
                 * time so we go back to the normal form. */
                setTimeout(() => {
                    setChangeDetailsSuccess(false);
                }, 3000);
            } else {
                const errorMessages = result.data.editUserDetails.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setChangeDetailsErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    const handleSubmitChangePassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword === currentPassword) {
            setChangePasswordErrors(["New password is the same as current password."]);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setChangePasswordErrors(["New password and new password confirm do not match"]);
            return;
        }

        setChangePasswordErrors([]);

        const variables = {
            password: currentPassword,
            newPassword: newPassword,
        };
        changePassword(variables).then((result) => {
            if (result.data.changePassword.errors.length === 0) {
                setChangePasswordSuccess(true);
                /* We only want to give feedback that the password change has been successful for a certain amount of
                 * time so we go back to the normal form. */
                setTimeout(() => {
                    setChangePasswordSuccess(false);
                }, 3000);
            } else {
                const errorMessages = result.data.changePassword.errors.map(
                    (error: { msg: string }) => error.msg
                );
                setChangePasswordErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div>
            <Head>
                <title>lectern - Account settings</title>
            </Head>
            <Navigation />
            <div className={styles.top_container}>
                <div className={styles.left_container}>
                    <BackToDashboard />
                </div>
                <div className={styles.right_container}>
                    <h1>Profile details</h1>

                    {fetching ? (
                        <p>Loading...</p>
                    ) : (
                        <div>
                            <h2>{data.userDetails.user.name}</h2>

                            <div className={styles.bio_container}>
                                <Image
                                    id={styles.user_pic}
                                    width={96}
                                    height={96}
                                    src={data.userDetails.user.pic}
                                    alt={`${data.userDetails.user.name}'s profile picture`}
                                />
                                <div className={styles.bio_text_container}>
                                    <p className={styles.bio_text_text}>
                                        {data.userDetails.user.bio.length === 0
                                            ? "User has no biography."
                                            : data.userDetails.user.bio}
                                    </p>
                                </div>
                            </div>

                            <p>
                                Profile pictures can be configured via{" "}
                                <a href="https://en.gravatar.com/">Gravatar</a>
                            </p>
                            <form id={styles.form_change_password} onSubmit={handleEditUserDetails}>
                                <h2>Change details</h2>
                                <div className="container_input_label">
                                    <div className="container_input_label">
                                        <label className="label" htmlFor="">
                                            Bio
                                        </label>
                                        <input
                                            className="input"
                                            id={styles.question_textarea}
                                            type="text"
                                            maxLength={64}
                                            onChange={(e) => setBio(e.target.value)}
                                            defaultValue={data.userDetails.user.bio}
                                        />
                                    </div>
                                </div>
                                {changeDetailsErrors.map((error, i) => (
                                    <p className="error" key={i}>
                                        {error}
                                    </p>
                                ))}
                                {changeDetailsBtnOrMsg}
                            </form>
                            <h2 id={styles.header_security}>Security</h2>
                            <form
                                id={styles.form_change_password}
                                onSubmit={handleSubmitChangePassword}
                            >
                                <h3>Change password</h3>
                                <div className="container_input_label">
                                    <label className="label">Current password</label>
                                    <InputPassword
                                        value={currentPassword}
                                        setValue={setCurrentPassword}
                                    />
                                </div>
                                <div className="container_input_label">
                                    <label className="label">New password</label>
                                    <InputPassword value={newPassword} setValue={setNewPassword} />
                                </div>
                                <div className="container_input_label">
                                    <label className="label">Confirm new password</label>
                                    <InputPassword
                                        value={newPasswordConfirm}
                                        setValue={setNewPasswordConfirm}
                                    />
                                </div>
                                {changePasswordErrors.map((error, i) => (
                                    <p className="error" key={i} style={{ textAlign: "left" }}>
                                        {error}
                                    </p>
                                ))}
                                {changePasswordBtnOrMsg}
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
