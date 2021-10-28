import {
    MiddlewareFn,
    NextFn,
    ResolverData,
    UseMiddleware,
} from "type-graphql";
import { Context, EndpointResponse } from "../types";
import { LoginSession, User } from "../entities/entities";

import config from "../config";
import { MethodAndPropDecorator } from "type-graphql/dist/decorators/types";

const failResp = EndpointResponse.withErrors({
    kind: "NOT_AUTHORISED",
    msg: "You must be logged in to access this.",
});

/* A factory function that returns our auth middleware. We use a factory so
 * we can pass options to the middleware (honestly I'm not sure if we'll ever
 * *not* need to fetch user details but hey this pattern's cool) */
export function AuthMiddleware(): MiddlewareFn<Context> {
    return async ({ context }: ResolverData<Context>, next: NextFn) => {
        const { req, res, conn } = context;

        const token = req.cookies.token;
        if (token === undefined) return failResp;

        try {
            /* checks if the session is valid */
            const repo = conn.getRepository(LoginSession);
            const thisSess = await repo.findOne({ token: token });
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
            return failResp;
        }
    };
}

/* A decorator which wraps our auth middleware (so we don't have to call
 * UseMiddleware every time) */
export default function CheckAuth(): MethodAndPropDecorator {
    return UseMiddleware(AuthMiddleware());
}
