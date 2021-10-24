import { FormEvent, useState } from "react";
import { useMutation } from "urql";
import InputPassword from "../../components/InputPassword";
import Navigation from "../../components/Navigation";
import styles from "../../styles/settings.module.css";

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

export default function Settings() {
    const [changePasswordResult, changePassword] = useMutation(MutationChangePassword);

    const [errors, setErrors] = useState([] as string[]);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

    const handleSubmitChangePassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword == currentPassword) {
            setErrors(["New password is the same as current password."]);
            return;
        }

        if (newPassword != newPasswordConfirm) {
            setErrors(["New password and new password confirm do not match"]);
            return;
        }

        setErrors([]);

        const variables = {
            password: currentPassword,
            newPassword: newPassword,
        };
        changePassword(variables).then((result) => {
            if (result.data.changePassword.errors.length == 0) {
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
                setErrors((errors) => [...errors, errorMessages]);
            }
        });
    };

    return (
        <div className="container_center">
            <Navigation />
            <div>
                <h1>Account settings</h1>
                <h2 id={styles.header_security}>Security</h2>
                <form id={styles.form_change_password} onSubmit={handleSubmitChangePassword}>
                    <h3>Change password</h3>
                    <div className="container_input_label">
                        <label className="label">Current password</label>
                        <InputPassword setValue={setCurrentPassword} />
                    </div>
                    <div className="container_input_label">
                        <label className="label">New password</label>
                        <InputPassword setValue={setNewPassword} />
                    </div>
                    <div className="container_input_label">
                        <label className="label">Confirm new password</label>
                        <InputPassword setValue={setNewPasswordConfirm} />
                    </div>
                    {errors.map((error, i) => (
                        <p className="error" key={i}>
                            {error}
                        </p>
                    ))}
                    {!changePasswordSuccess && (
                        <button className="btn btn_secondary" type="submit">
                            Change password
                        </button>
                    )}
                    {changePasswordSuccess && <h3>Password successfully changed!</h3>}
                </form>
            </div>
        </div>
    );
}
