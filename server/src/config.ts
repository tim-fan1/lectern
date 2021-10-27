// we should probably make this reference a private (not in version control)
// config file later with e.g. database connection info
import { config } from "dotenv";
config();

const isTest = process.env.NODE_ENV === "test";
const company_email_address = isTest ? undefined : process.env.company_email_address;
const company_email_password = isTest ? undefined : process.env.company_email_password;

export function emailCredentialsSpecified() {
    return (
        typeof company_email_address !== "undefined" &&
        typeof company_email_password !== "undefined"
    );
}

export default {
    isProduction: process.env.NODE_ENV === "production",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    isTest: isTest,
    company_email_address: company_email_address,
    company_email_password: company_email_password,
};

if (!emailCredentialsSpecified() && !isTest) {
    console.warn(
        `Email credentials not specified - emails will not be sent, and instead printed to console\n` +
            `this warning can be safely ignored if expected (e.g. run in a testing environment)`
    );
}
