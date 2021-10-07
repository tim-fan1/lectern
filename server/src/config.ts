// we should probably make this reference a private (not in version control)
// config file later with e.g. database connection info

export default {
    isProduction: process.env.NODE_ENV === "production",
};
