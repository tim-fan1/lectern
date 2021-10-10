/* Regular expressions used; compile at server start to use later */
const email_regexp = new RegExp(
    /* https://stackoverflow.com/a/1373724. Hope this works... */
    "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
);
/* Username needs to be:
 * - 4-15 characters
 * - Must start with an alphabet
 * - Must contain only the alphabet + the numbers + the underscore. */
const username_regex = new RegExp("^[A-Za-z][A-Za-z0-9_]{3,14}$");

/**
 * Validating email.
 */
export const validateEmail = (email: string): boolean => {
    // the regex looks big and scawy so I'm not touching it
    if (email.length > 128) return false;
    return email_regexp.test(email);
};

/**
 * Validating username.
 */
export const validateUsername = (username: string): boolean => {
    return username_regex.test(username);
};

/**
 * Validating password. TODO: maybe a stronger algorithm lmao.
 */
export const validatePassword = (password: string): boolean => {
    return 8 <= password.length && password.length <= 30;
};
