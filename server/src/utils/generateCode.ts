const codeUppercaseA = "A".charCodeAt(0);

/**
 * Generates an (uppercase) alphanumeric code of specified length (default 6).
 * @param length the desired length of the code
 * @returns the generated code
 */
export default function generateAlphanumCode(length: number = 6): string {
    let code = "";
    for (let i = 0; i < length; i++) {
        /* we generate an int value between 0 and 35; if the value is leq 25,
         * we use an alphabetical character; otherwise we use a digit. */
        const thisValue = Math.floor(Math.random() * 36);
        code +=
            thisValue < 26
                ? String.fromCharCode(codeUppercaseA + thisValue)
                : (thisValue - 26).toString();
    }

    return code;
}
