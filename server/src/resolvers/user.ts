import argon2 from "argon2";
import { Arg, Ctx, Field, Mutation, ObjectType, Query } from "type-graphql";
import { v4 as uuid } from "uuid";

import { User, LoginSession } from "../entities/entities";
import { AuthedContext, Context, EndpointResponse, RespError } from "../types";
import {
    validateEmail,
    validatePassword,
    validateName,
} from "../utils/validate";
import sendEmail from "../utils/sendEmail";
import generateAlphanumCode from "../utils/generateCode";
import config from "../config";
import CheckAuth from "../utils/authMiddleware";
import { Connection, getRepository } from "typeorm";
import { MD5 } from "../utils/md5";

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
    PASSWORD_SAME_AS_NEW_PASSWORD = "PASSWORD_SAME_AS_NEW_PASSWORD",
}
async function isLoggedIn(conn: Connection, token: string): Promise<boolean> {
    const loginSessionRepo = conn.getRepository(LoginSession);
    const loginSessionItem = await loginSessionRepo.findOne({
        where: { token: token },
    });
    return loginSessionItem !== undefined;
}

/**
 * User resolver: contains GraphQL endpoints related to account management.
 */
export default class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("email") email: string,
        @Arg("fname") fname: string,
        @Arg("lname") lname: string,
        @Arg("password") password: string,
        @Ctx() { conn, req }: Context
    ): Promise<UserResponse> {
        if (await isLoggedIn(conn, req.cookies.token)) {
            return UserResponse.withErrors({
                kind: UserError.LOGGED_IN,
                msg: "Already logged in!",
            });
        }

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
        let user, userRepo;
        try {
            userRepo = conn.getRepository(User);
            user = await userRepo.findOne({ where: { email: email } });
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

        /* Insert entry for this user into the db (storing the hashed pw and
         * generating a verification code). */
        const hashedPassword = await argon2.hash(password);
        const verificationCode = generateAlphanumCode(12);
        try {
            const exist = await userRepo.findOne({
                where: { verifyResetCode: verificationCode },
            });
            if (exist)
                return EndpointResponse.withErrors({
                    kind: UserError.USED_TOKEN,
                    msg: "Token already exists; go buy a lottery ticket",
                });

            let newUser = userRepo.create({
                name: fname + " " + lname,
                password: hashedPassword,
                email: email,
                verified: false,
                /* Each newly registered user has a unique verification code mapped to them. */
                verifyResetCode: verificationCode,
                pic:
                    "https://www.gravatar.com/avatar/" +
                    MD5(email) +
                    "?d=retro",
            });
            user = await userRepo.save(newUser);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* Send verification email. */
        sendEmail(
            email,
            "Verify Your Email",
            `${config.frontendUrl}/verify/${verificationCode}`
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
        if (await isLoggedIn(conn, req.cookies.token)) {
            return UserResponse.withErrors({
                kind: UserError.LOGGED_IN,
                msg: "Already logged in!",
            });
        }

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
                msg: `The email ${email} is not a verified account`,
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
                user: user,
            });

            await repo.save(newSession);
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
        // if the options are changed here, they also need to be changed when
        // we're unsetting the token (in both logout and the auth mware)
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

    @CheckAuth()
    @Mutation(() => EndpointResponse)
    async logout(
        @Ctx() { res, conn, loginToken }: AuthedContext
    ): Promise<EndpointResponse> {
        // this doesn't check if the session existed or not
        try {
            const repo = conn.getRepository(LoginSession);
            await repo.delete(loginToken!);
            res.clearCookie("token", {
                httpOnly: true,
                secure: true,
                sameSite: config.isProduction ? "strict" : "none",
            });

            return { errors: [] };
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @CheckAuth(["user.sessions"])
    @Query(() => UserResponse)
    async userDetails(@Ctx() { user }: AuthedContext): Promise<UserResponse> {
        try {
            return {
                errors: [],
                user: user,
            };
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }
    }

    @Mutation(() => EndpointResponse)
    async verifyEmail(
        @Arg("verificationCode") verificationCode: string,
        @Ctx() { conn }: Context
    ): Promise<EndpointResponse> {
        /* Check if there exists a user with this verification code. */
        const userRepo = conn.getRepository(User);
        let user;
        try {
            user = await userRepo.findOne({
                where: { verifyResetCode: verificationCode },
            });
            if (user === undefined)
                return EndpointResponse.withErrors({
                    kind: UserError.INVALID_VERIFICATION_CODE,
                    msg: "Invalid verification code",
                });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* Found user. Now verify them, and set the verify code to null. */
        user.verified = true;
        try {
            user.verified = true;
            user.verifyResetCode = null;
            await userRepo.save(user);
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

    @CheckAuth()
    @Mutation(() => EndpointResponse)
    async changePassword(
        @Arg("password") password: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { user, conn }: AuthedContext
    ): Promise<EndpointResponse> {
        try {
            /* First check if the newPassword is even valid. */
            if (!validatePassword(newPassword)) {
                return EndpointResponse.withErrors({
                    kind: UserError.BAD_PASSWORD,
                    msg: "Invalid password given",
                });
            }

            /* Check that they have given the correct current password. */
            const passwordValid = await argon2.verify(user.password, password);
            if (!passwordValid) {
                return EndpointResponse.withErrors({
                    kind: UserError.INCORRECT_PASSWORD,
                    msg: "Current password given is incorrect",
                });
            }

            /* Shouldn't let the user make the password the same as the current one. */
            const newPasswordValid = !(await argon2.verify(
                user.password,
                newPassword
            ));
            if (!newPasswordValid) {
                return EndpointResponse.withErrors({
                    kind: UserError.PASSWORD_SAME_AS_NEW_PASSWORD,
                    msg: "New password given is the same as current password",
                });
            }

            user.password = await argon2.hash(newPassword);
            await conn.getRepository(User).save(user);
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        return {
            errors: [],
        };
    }

    @Mutation(() => EndpointResponse)
    async requestReset(
        @Arg("email") email: string,
        @Ctx() { conn }: Context
    ): Promise<EndpointResponse> {
        const userRepo = conn.getRepository(User);
        let user;
        try {
            user = await userRepo.findOne({ where: { email: email } });
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        /* No matter what, send an empty success response (unless db error) so
         * that bad actors can't get information from the reset password form */
        const ret = EndpointResponse.withErrors();

        /* Check if user does not exist, or there is an ongoing verify/reset */
        if (user === undefined || user.verifyResetCode !== null) return ret;

        /* Check for code collision */
        const resetCode = generateAlphanumCode(12);
        if (
            await userRepo.findOne({
                where: { verifyResetCode: resetCode },
            })
        )
            return ret;

        user.verifyResetCode = resetCode;
        await userRepo.save(user);

        /* send the email asynchronously */
        sendEmail(
            user.email,
            "Reset Your Password",
            `${config.frontendUrl}/reset/${resetCode}`
        );

        return ret;
    }

    @Mutation(() => EndpointResponse)
    async passwordReset(
        @Arg("code") code: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { conn }: Context
    ): Promise<EndpointResponse> {
        const userRepo = conn.getRepository(User);
        let user;
        let errors: RespError[] = [];

        if (!validatePassword(newPassword)) {
            errors.push({
                kind: UserError.BAD_PASSWORD,
                msg: "Invalid password given",
            });
        }

        try {
            user = await userRepo.findOne({ where: { verifyResetCode: code } });
        } catch (e: Error | any) {
            errors.push({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        if (user === undefined || !user.verified) {
            errors.push({
                kind: UserError.INVALID_VERIFICATION_CODE,
                msg: "Invalid verification link",
            });
            return EndpointResponse.withErrors(...errors);
        }

        const newPasswordValid = !(await argon2.verify(
            user.password,
            newPassword
        ));
        if (!newPasswordValid) {
            return EndpointResponse.withErrors({
                kind: UserError.PASSWORD_SAME_AS_NEW_PASSWORD,
                msg: "New password given is the same as current password",
            });
        }

        try {
            user.password = await argon2.hash(newPassword);
            user.verifyResetCode = null;
            await userRepo.save(user);
        } catch (e: Error | any) {
            return EndpointResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        return EndpointResponse.withErrors();
    }

    @CheckAuth()
    @Mutation(() => UserResponse)
    async editUserDetails(
        @Arg("bio") bio: string,
        @Ctx() { user, conn }: AuthedContext
    ) {
        try {
            user.bio = bio;
            await conn.getRepository(User).save(user);
        } catch (e: Error | any) {
            return UserResponse.withErrors({
                kind: UserError.DB_ERROR,
                msg: e.message,
            });
        }

        return {
            errors: [],
            user: user,
        };
    }
}
