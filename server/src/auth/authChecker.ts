import { AuthChecker, ResolverData } from "type-graphql";
import { LoginSession } from "../entities/entities";
import { Context } from "../types";

/* This is a custom AuthChecker that hooks into TypeGraphQL's authorization
 * feature (https://typegraphql.com/docs/authorization.html). */
const userAuthChecker: AuthChecker<Context> = async ({
    context,
}: ResolverData<Context>): Promise<boolean> => {
    const { req, res, conn } = context;

    const token = req.cookies.token;
    if (token === undefined) return false;

    try {
        /* checks if the session is valid */
        const repo = conn.getRepository(LoginSession);
        const thisSess = await repo.findOne({ token: token });
        if (thisSess === undefined) {
            /* user had an invalid cookie; unset it */
            res.clearCookie("token");
            return false;
        }

        /* session valid, set user details and return */
        res.locals.userId = thisSess.user.id;
        return true;
    } catch (e: Error | any) {
        console.error("(auth) " + e.message);
    }

    return false;
};

export default userAuthChecker;
