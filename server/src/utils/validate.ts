/* Regular expressions used; compile at server start to use later */
const email_regexp = new RegExp(
    /* https://stackoverflow.com/a/1373724. Hope this works... */
    "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
);

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
export const validateName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 26;
};

/**
 * Validating password.
 */
export const validatePassword = (password: string): boolean => {
    return 8 <= password.length && password.length <= 30;
};
