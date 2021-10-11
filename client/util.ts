/* TODO: make this constraint consistent with server, should we check for non-alphanumeric chars? */
export function validateSessionCode(code: string): boolean {
    return code.length == 6;
}
