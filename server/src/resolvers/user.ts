import argon2 from "argon2";
import {
    Arg,
    Authorized,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
} from "type-graphql";
import { v4 as uuid } from "uuid";

import { User, LoginSession } from "../entities/entities";
import { Context, EndpointResponse, RespError, StringResponse } from "../types";
import {
    validateEmail,
    validatePassword,
    validateUsername,
} from "../utils/validate";

@ObjectType()
class UserResponse extends EndpointResponse {
    @Field({ nullable: true })
    user?: User;
}

/**
 * This only exists now for convenience and reference. The original design
 * had RespError as a generic which took in an error enum, however (1) enum
 * support in TypeGQL is... odd, and (2) generics support is similarly odd
 * (it would be nicer, but implementing that would require two generic class
 * factories to be called for each new error type + an accompanying function
 * call to register each error enum and that really just doesn't sound worth)
 */
enum UserError {
    DB_ERROR = "DB_ERROR",
    LOGGED_IN = "LOGGED_IN",
    EMAIL_EXISTS = "EMAIL_EXISTS",
    EMAIL_NOT_EXIST = "EMAIL_NOT_EXIST",
    BAD_EMAIL = "BAD_EMAIL",
    BAD_PASSWORD = "BAD_PASSWORD",
    BAD_USERNAME = "BAD_USERNAME",
    INCORRECT_PASSWORD = "INCORRECT_PASSWORD",
    USER_UNVERIFIED = "USER_UNVERIFIED",
    USED_TOKEN = "USED_TOKEN",
}

export default class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("email") email: string,
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { conn, res }: Context
    ): Promise<UserResponse> {
        if (res.locals.userId !== undefined)
            return UserResponse.withErrors({
                kind: UserError.LOGGED_IN,
                msg: "Already logged in!",
            });

        /* Validate username, password, email. */
        const validationErrors: RespError[] = [];
        if (!validateEmail(email))
            validationErrors.push({
                kind: UserError.BAD_EMAIL,
                msg: "Invalid email",
            });
        if (!validatePassword(password))
            validationErrors.push({
                kind: UserError.BAD_PASSWORD,
                msg: "Invalid password",
            });
        if (!validateUsername(username))
            validationErrors.push({
                kind: UserError.BAD_USERNAME,
                msg: "Invalid username",
            });
        if (validationErrors.length > 0)
            return UserResponse.withErrors(...validationErrors);

        /* Insert entry for this user into the db (storing the hashed pw). */
        const hashedPassword = await argon2.hash(password);
        let user!: User;
        try {
            const repo = conn.getRepository(User);
            let meme = repo.create({
                username: username,
                password: hashedPassword,
                email: email,
                /* When verification emails are working,
                 * This should be set to false by default. */
                verified: true,
            });
            user = await repo.save(meme);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /**
         * TODO:
         * Send a verification email to the user (at options.email).
         * Once the user clicks on the link in that email, user.verified is set,
         * and the user is allowed to login.
         *
         * TODO:
         * (One possible way(?)) to do the above is to use another table,
         * say verify_table, that maps a unique strong token to a user id.
         * We store the (token,userid) pair inside verify_table, and put the
         * token inside the verification email. Clicking the link then causes
         * the user with the user id mapped to the token (inside the email) to
         * be verified. The (token,userid) entry should be removed from
         * verify_table after a (preferably short) period of time.
         *
         * One possible issue is that someone could spam verify
         * until the token matches the user id of the user account they
         * want to verify. However, if the token is long enough, and the
         * verification time period is short enough, then this really
         * shouldn't be an issue.
         *
         * Bonus TODO:
         * Also allow the user to be automatically logged in after they click
         * the link (see how registration works at figma.com).
         */

        /* Success! */
        return {
            errors: [],
            user: user,
        };
    }

    @Mutation(() => EndpointResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req, res, conn }: Context
    ): Promise<EndpointResponse> {
        /* Really shady way of checking if someone's logged in */
        if (req.cookies.token !== undefined)
            return EndpointResponse.withErrors({
                kind: UserError.LOGGED_IN,
                msg: "Already logged in!",
            });

        /* Check that the input username/email and password are correct. */
        let user;
        try {
            const repo = conn.getRepository(User);
            user = await repo.findOne(
                usernameOrEmail.includes("@")
                    ? { where: { email: usernameOrEmail } }
                    : { where: { username: usernameOrEmail } }
            );
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        if (!user) {
            return EndpointResponse.withErrors({
                kind: UserError.EMAIL_NOT_EXIST,
                msg: "Username or email does not exist",
            });
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return EndpointResponse.withErrors({
                kind: UserError.INCORRECT_PASSWORD,
                msg: "Incorrect password",
            });
        }

        /* Details are correct! Now check that the user is verified. */
        if (!user.verified) {
            return EndpointResponse.withErrors({
                kind: UserError.USER_UNVERIFIED,
                msg: "User not verified",
            });
        }

        /* User is also verified. Generate session token and store in res.cookies. */
        const newToken = uuid();
        try {
            const repo = conn.getRepository(LoginSession);
            const exist = await repo.findOne(newToken);
            if (exist)
                return EndpointResponse.withErrors({
                    kind: UserError.USED_TOKEN,
                    msg: "Token already exists; go buy a lottery ticket",
                });

            const newSession = repo.create({
                token: newToken,
                userId: user.id,
            });

            await repo.save(newSession);
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        res.cookie("token", newToken, {
            httpOnly: true,
            secure: true,
        });

        /* TODO: work out how to fix this: https://stackoverflow.com/questions/34558264/fetch-api-with-cookie */

        /* Success! */
        return {
            errors: [],
        };
    }

    @Authorized()
    @Mutation(() => EndpointResponse)
    async logout(
        @Ctx() { req, res, conn }: Context
    ): Promise<EndpointResponse> {
        // this doesn't check if the session existed or not
        try {
            const repo = conn.getRepository(LoginSession);
            repo.delete(req.cookies.token);
            res.clearCookie("token", {
                httpOnly: true,
                secure: true,
            });

            return { errors: [] };
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Authorized()
    @Query(() => StringResponse)
    async testAuth(@Ctx() { res, conn }: Context): Promise<StringResponse> {
        // this is a temp mutation, so i havent wrapped it in try/catch
        const name = (await conn.getRepository(User).findOne(res.locals.userId))
            ?.username;

        return { errors: [], msg: "hello, " + name + "!" };
    }
}
