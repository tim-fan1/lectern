import { UsernamePassword } from "../entities/entities";

export const validateRegister = (options: UsernamePassword) => {
    /**
     * Validating email.
     */
    const email_regexp = new RegExp(
        /* https://stackoverflow.com/a/1373724. Hope this works... */
        "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
    );
    if (!options.email.includes("@")) {
        /* Email must contain the @ symbol. */
        return {
            success: false,
            msg: "Invalid email",
        };
    }
    if (!email_regexp.test(options.email)) {
        /* It didn't pass the shifty regex. */
        return {
            success: false,
            msg: "Invalid email",
        };
    }

    /**
     * Validating username.
     */
    if (options.username.includes("@")) {
        /* Username must not contain the @ symbol. */
        return {
            success: false,
            msg: "Invalid username",
        };
    }
    const username_regex = new RegExp("^[A-Za-z][A-Za-z0-9_]{3,14}$");
    if (!username_regex.test(options.username)) {
        /* Username needs to be:
         * - 4-15 characters
         * - Must start with an alphabet
         * - Must contain only the alphabet + the numbers + the underscore. */
        return {
            success: false,
            msg: "Invalid username",
        };
    }

    /**
     * Validating password. TODO: maybe a stronger algorithm lmao.
     */
    if (!(8 <= options.password.length && options.password.length <= 30)) {
        return {
            success: false,
            msg: "Bad password",
        };
    }

    /* Success! */
    return {
        success: true,
        msg: "Username/Email/Password are valid",
    };
};
