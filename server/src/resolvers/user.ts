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

import { User, LoginSession, VerifyEmail } from "../entities/entities";
import { Context, EndpointResponse, RespError, StringResponse } from "../types";
import {
    validateEmail,
    validatePassword,
    validateName,
} from "../utils/validate";
import send_email from "../utils/sendEmail";
import generateAlphanumCode from "../utils/generateCode";
import config from "../config";

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
    USER_NOT_EXIST = "USER_NOT_EXIST",
    INVALID_VERIFICATION_CODE = "INVALID_VERIFICATION_CODE",
}

export default class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("email") email: string,
        @Arg("fname") fname: string,
        @Arg("lname") lname: string,
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
                msg: "Your password should be between 8 and 30 characters inclusive",
            });
        if (!validateName(fname))
            validationErrors.push({
                kind: UserError.BAD_USERNAME,
                msg: "Your first name should be between 2 and 26 characters inclusive",
            });
        if (!validateName(lname))
            validationErrors.push({
                kind: UserError.BAD_USERNAME,
                msg: "Your last name should be between 2 and 26 characters inclusive",
            });
        if (validationErrors.length > 0)
            return UserResponse.withErrors(...validationErrors);

        /* Check that account with given email doesn't already exist. */
        let user;
        try {
            const repo = conn.getRepository(User);
            user = await repo.findOne({ where: { email: email } });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        if (user) {
            return EndpointResponse.withErrors({
                kind: UserError.EMAIL_EXISTS,
                msg: `An account with the email ${email} already exists`,
            });
        }

        /* Insert entry for this user into the db (storing the hashed pw). */
        const hashedPassword = await argon2.hash(password);
        try {
            const repo = conn.getRepository(User);
            let meme = repo.create({
                name: fname + " " + lname,
                password: hashedPassword,
                email: email,
                verified: false,
            });
            user = await repo.save(meme);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* Send verification email. TODO: this uses a new table VerifyEmail,
         * even though LoginSession already exists and does the same thing.
         * Decided to make a new table anyway because I don't want to
         * and don't know if I should mess with the LoginSession table. */
        const verification_code = generateAlphanumCode();
        try {
            const repo = conn.getRepository(VerifyEmail);
            const exist = await repo.findOne(verification_code);
            if (exist)
                return EndpointResponse.withErrors({
                    kind: UserError.USED_TOKEN,
                    msg: "Token already exists; go buy a lottery ticket",
                });

            const newVerificationToken = repo.create({
                token: verification_code,
                userId: user.id,
            });

            await repo.save(newVerificationToken);
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        await send_email(
            email,
            "Verify Your Email",
            `${config.frontend_url}/verify/${verification_code}`
        );

        /* Success! */
        return {
            errors: [],
            user: user,
        };
    }

    @Mutation(() => EndpointResponse)
    async login(
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Ctx() { req, res, conn }: Context
    ): Promise<EndpointResponse> {
        /* FIXME: Really shady way of checking if someone's logged in */
        if (req.cookies.token !== undefined)
            return EndpointResponse.withErrors({
                kind: UserError.LOGGED_IN,
                msg: "Already logged in!",
            });

        /* Check that the input username/email and password are correct. */
        let user;
        try {
            const repo = conn.getRepository(User);
            user = await repo.findOne({ where: { email: email } });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        if (!user) {
            return EndpointResponse.withErrors({
                kind: UserError.EMAIL_NOT_EXIST,
                msg: `An account with the email address ${email} does not exist`,
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
            sameSite: config.isProduction ? "strict" : "none", // none to send them to apollo studio
        });

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
    @Query(() => UserResponse)
    async userDetails(@Ctx() { res, conn }: Context): Promise<UserResponse> {
        try {
            const userRepo = conn.getRepository(User);
            const thisUser = await userRepo.findOne(res.locals.userId);
            if (thisUser === undefined)
                return UserResponse.withErrors({
                    kind: UserError.USER_NOT_EXIST,
                });

            return {
                errors: [],
                user: thisUser,
            };
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Mutation(() => EndpointResponse)
    async verify_email(
        @Arg("verification_code") verification_code: string,
        @Ctx() { req, res, conn }: Context
    ): Promise<EndpointResponse> {
        /* Check if verification code is valid. */
        let VerifyEmailItem;
        try {
            const repo = conn.getRepository(VerifyEmail);
            VerifyEmailItem = await repo.findOne({
                where: { token: verification_code },
            });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        if (!VerifyEmailItem) {
            return EndpointResponse.withErrors({
                kind: UserError.INVALID_VERIFICATION_CODE,
                msg: `Invalid verification code`,
            });
        }

        /* Valid verification code. Find user pointed by valid code. */
        let user;
        try {
            const repo = conn.getRepository(User);
            user = await repo.findOne({
                where: { id: VerifyEmailItem.userId },
            });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        if (!user) {
            return EndpointResponse.withErrors({
                kind: UserError.USER_NOT_EXIST,
                msg: `User doesn't exist... Something went really wrong on our end`,
            });
        }

        /* Found user. Now verify them. */
        user.verified = true;
        try {
            const repo = conn.getRepository(User);
            await repo.save(user);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* Remove VerifyEmailItem from VerifyEmail. Free up that code. */
        try {
            const repo = conn.getRepository(VerifyEmail);
            await repo.remove(VerifyEmailItem);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* User should be verified now. Success! */
        return {
            errors: [],
        };
    }

    // @Authorized()
    // @Query(() => StringResponse)
    // async testAuth(@Ctx() { res, conn }: Context): Promise<StringResponse> {
    //     // this is a temp mutation, so i havent wrapped it in try/catch
    //     const name = (await conn.getRepository(User).findOne(res.locals.userId))
    //         ?.username;

    //     return { errors: [], msg: "hello, " + name + "!" };
    // }
}
