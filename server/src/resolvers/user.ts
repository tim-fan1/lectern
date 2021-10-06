import argon2 from "argon2";
import { Arg, Ctx, Field, Mutation, ObjectType } from "type-graphql";
import { getConnection } from "typeorm";

import { User, UsernamePassword } from "../entities/entities";
import { Context } from "../types";
import { validateRegister } from "../utils/validate";

@ObjectType()
class InputError {
    @Field()
    name!: string;
    @Field()
    msg!: string;
}

@ObjectType()
class Response {
    @Field(() => [InputError], { nullable: true })
    err?: InputError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

export default class UserResolver {
    @Mutation(() => Response)
    async register(
        @Arg("options") options: UsernamePassword,
        @Ctx() { req }: Context
    ): Promise<Response> {
        /* TODO: Validate username, password, email. */
        const err = validateRegister(options);
        if (err) {
            /* Failure... Return err object (name, msg) to client. */
            return { err };
        }

        /* Insert entry for this user into the db (storing the hashed pw). */
        const hashedPassword = await argon2.hash(options.password);
        let user!: User;
        try {
            const conn = getConnection();
            const repo = conn.getRepository(User);
            let meme = repo.create({
                username: options.username,
                password: hashedPassword,
                email: options.email,
                /* When verification emails are working,
                 * This should be set to false by default. */
                verified: true,
            });
            user = await repo.save(meme);
        } catch (e: Error | any) {
            /* Failure... Return err object (name, msg) to client. */
            return { err: [{ name: e.name, msg: e.message }] };
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

        /* Success! Return User's exposed @Fields to client. */
        return { user: user };
    }

    @Mutation(() => Response)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: Context
    ): Promise<Response> {
        const conn = getConnection();
        const repo = conn.getRepository(User);
        const user = await repo.findOne(
            usernameOrEmail.includes("@")
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }
        );

        if (!user) {
            return {
                err: [
                    {
                        name: "usernameOrEmail",
                        msg: "Username does not exist.",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                err: [
                    {
                        name: "password",
                        msg: "Incorrect password.",
                    },
                ],
            };
        }

        // req.cookies.userId = user.id;

        return {
            user,
        };
    }
}
