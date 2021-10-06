import argon2 from "argon2";
import { Arg, Ctx, Field, Mutation, ObjectType } from "type-graphql";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";

import { User, Session } from "../entities/entities";
import { Context } from "../types";
import { validateRegister } from "../utils/validate";

@ObjectType()
class Response {
    @Field()
    success!: boolean;
    @Field()
    msg!: string;
}

export default class UserResolver {
    @Mutation(() => Response)
    async register(
        @Arg("email") email: string,
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { conn }: Context
    ): Promise<Response> {
        /* Validate username, password, email. */
        const response = validateRegister(email, username, password);
        if (!response.success) {
            return {
                success: false,
                msg: response.msg,
            };
        }

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
            return {
                success: false,
                msg: e.message,
            };
        }

        // req.cookies.userId = user.id;

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
            success: true,
            msg: "Successfully registered!",
        };
    }

    @Mutation(() => Response)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { res, conn }: Context
    ): Promise<Response> {
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
            return {
                success: false,
                msg: e.message,
            };
        }

        if (!user) {
            return {
                success: false,
                msg: "Username or email does not exist",
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                success: false,
                msg: "Incorrect password",
            };
        }

        /* Details are correct! Now check that the user is verified. */
        if (!user.verified) {
            return {
                success: false,
                msg: "User is not verified",
            };
        }

        /* User is also verified. Generate session token and store in res.cookies. */
        const newToken = uuid();
        try {
            const repo = conn.getRepository(Session);
            const exist = await repo.findOne(newToken);
            if (exist)
                throw Error("newToken already exists; go buy a lottery ticket");

            repo.create({
                token: newToken,
                userId: user.id,
            });
        } catch (e: Error | any) {
            return { success: false, msg: e.message };
        }
        res.cookie("token", newToken, {
            httpOnly: true,
            secure: true,
        });

        /* TODO: work out how to fix this: https://stackoverflow.com/questions/34558264/fetch-api-with-cookie */

        /* Success! */
        return {
            success: true,
            msg: "Successfully logged in!",
        };
    }
}
