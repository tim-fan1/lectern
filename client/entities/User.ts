import { Session } from "./entities";
import LoginSession from "./LoginSession";

export default class User {
    id!: number;

    created!: Date;

    updated!: Date;

    name!: string;

    email!: string;

    password!: string;

    verified!: boolean;

    sessions!: Session[];

    loginSessions!: LoginSession[];

    /* Used for verification or reset codes on this user; only really makes
     * sense to have one of either active at any time. For now, if the user
     * is unverified, this contains the verification code and they cannot
     * reset their password; otherwise if there's an active reset code then
     * it will be overwritten when they go to reset their password.
     * fun stuff:
     * https://stackoverflow.com/questions/64635617/how-to-set-a-nullable-database-field-to-null-with-typeorm */

    verifyResetCode!: string | null;

    bio: string = "";

    pic!: string;
}
