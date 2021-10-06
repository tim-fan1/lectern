import { UsernamePassword } from "../entities/entities";

export const validateRegister = (options: UsernamePassword) => {
    // TODO: email must be a "valid" email; it must pass a simple email regex test.
    if (!options.email.includes("@")) {
        return [
            {
                name: "email",
                msg: "invalid email",
            },
        ];
    }

    // TODO: username can't contain @. this check is important.

    // TODO: username must be in range [4,X], and contain 2 special symbols.
    if (options.username.length <= 3) {
        return [
            {
                name: "username",
                msg: "username length must be greater than x",
            },
        ];
    }

    // TODO: password must be good.
    if (options.password.length <= 3) {
        return [
            {
                name: "password",
                msg: "length must be greater than x",
            },
        ];
    }

    return null;
};
