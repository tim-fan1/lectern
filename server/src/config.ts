// we should probably make this reference a private (not in version control)
// config file later with e.g. database connection info
import { config } from "dotenv";
config();

export default {
    isProduction: process.env.NODE_ENV === "production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    serverPort: parseInt(process.env.PORT || "4000"),
    companyEmailAddress: process.env.COMPANY_EMAIL_ADDRESS,
    companyEmailPassword: process.env.COMPANY_EMAIL_ADDRESS,
};
