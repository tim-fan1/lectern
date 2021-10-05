import { Arg, Ctx, Field, Mutation, ObjectType } from "type-graphql";
import User from "../entities/User";
import UsernamePassword from "../entities/UsernamePassword";
import { Context } from "../types";
import { validateRegister } from "../utils/validate";
import argon2 from "argon2";
import { getRepository } from "typeorm";

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
    const err = validateRegister(options);
    if (err) {
      return { err };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user!: User;

    try {
      const repo = getRepository(User);
      let meme = repo.create({
        username: options.username,
        password: hashedPassword,
        email: options.email,
      });
      console.log(meme);
      repo.save(meme);
    } catch (e: Error | any) {
      return { err: [{ name: e.name, msg: e.message }] };
    }

    // req.cookies.userId = user.id;

    return { user };
  }
}
