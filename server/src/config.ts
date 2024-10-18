/* This config file exports all of the required configuration variables to be
 * used elsewhere in the codebase. Defining them in-code lets us use the type
 * system to make sure all required config vars are provided, while letting us
 * set them through environment variables as well. */

import { config } from "dotenv";
config();

export default {
    /* general config */
    isProduction: process.env.NODE_ENV === "production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    serverPort: parseInt(process.env.PORT || "4000"),
    /* email config */
    companyEmailAddress: process.env.COMPANY_EMAIL_ADDRESS,
    companyEmailPassword: process.env.COMPANY_EMAIL_PASSWORD,
};
