import UsernamePassword from "../entities/UsernamePassword";

export const validateRegister = (options: UsernamePassword) => {
    //TODO
    if (!options.email.includes("@")) {
        return [
            {
                name: "email",
                msg: "invalid email",
            },
        ];
    }

    //TODO
    if (options.username.length <= 3) {
        return [
            {
                name: "username",
                msg: "username length must be greater than x",
            },
        ];
    }

    //TODO
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
