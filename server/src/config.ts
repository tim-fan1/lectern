// we should probably make this reference a private (not in version control)
// config file later with e.g. database connection info
import { config } from "dotenv";
config();

import * as priv from "./config.private";

export default {
    isProduction: process.env.NODE_ENV === "production",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
    company_email_address: priv.company_email_address,
    company_email_password: priv.company_email_password,
};
