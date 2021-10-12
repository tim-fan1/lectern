// we should probably make this reference a private (not in version control)
// config file later with e.g. database connection info
import { config } from "dotenv";
config();

export default {
    isProduction: process.env.NODE_ENV === "production",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
};
