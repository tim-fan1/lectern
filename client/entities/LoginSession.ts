import User from "./User";

export default class LoginSession {
    token!: string;

    created!: Date;

    user!: User;
}
