import {
    MiddlewareFn,
    NextFn,
    ResolverData,
    UseMiddleware,
} from "type-graphql";
import { AuthedContext, EndpointResponse } from "../types";
import { LoginSession } from "../entities/entities";

import config from "../config";
import { MethodAndPropDecorator } from "type-graphql/dist/decorators/types";

/**
 * Our Auth decorator for resolver methods. Decorate with @CheckAuth() to
 * ensure that the user is logged in (an error EndpointResponse is returned
 * otherwise). When decorating, change the context type to AuthedContext to
 * access user info. More detail in types.ts
 * @param relations an array of relations to get on the relevant User
 */
export default function CheckAuth(
    relations: string[] = []
): MethodAndPropDecorator {
    return UseMiddleware(AuthMiddleware(relations));
}

const failResp = EndpointResponse.withErrors({
    kind: "NOT_AUTHORISED",
    msg: "You must be logged in to access this.",
});

/* A factory function that returns our auth middleware. We use a factory so
 * we can pass options to the middleware (honestly I'm not sure if we'll ever
 * *not* need to fetch user details but hey this pattern's cool)
 * Update: we no longer have any options to pass. Not worth refactoring back lul */
export function AuthMiddleware(
    relations: string[]
): MiddlewareFn<AuthedContext> {
    return async ({ context }: ResolverData<AuthedContext>, next: NextFn) => {
        const { req, res, conn } = context;

        const token = req.cookies.token;
        if (token === undefined) return failResp;
        context.loginToken = token;

        try {
            /* checks if the session is valid */
            const repo = conn.getRepository(LoginSession);
            const thisSess = await repo.findOne(
                { 
                    where: { 
                        token: token
                    },
                    relations: [
                        // Load loginSession.user first (always!),
                        "user", 
                        // And then, 
                        //
                        // if relations === ["user.sessions"], for example,
                        //
                        // load loginSession.user.sessions.
                        ...relations.map((r) => r)
                        //
                        // Note that relations like "session.activites",
                        // -- for some session in "user.sessions" --
                        // will always be loaded, because it is marked 
                        // as eager-loading in the Session entity.
                        // 
                        // And the same for a relation like "activity.choices",
                        // -- for some activity in "session.activiites" --
                        // will always be loaded, because it is marked
                        // as eager-loading in the Activity entity,
                    ],
                }
            );
            if (thisSess === undefined) {
                /* user had an invalid cookie; unset it */
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: true,
                    sameSite: config.isProduction ? "strict" : "none",
                });
                return failResp;
            }

            /* session valid, set user */
            context.user = thisSess.user;

            return next();
        } catch (e: Error | any) {
            console.error("(auth) " + e.message);
            return EndpointResponse.withErrors({ kind: "DB_ERROR" });
        }
    };
}
