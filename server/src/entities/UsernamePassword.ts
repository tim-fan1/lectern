import { Field, InputType } from "type-graphql";

@InputType()
export default class UsernamePassword {
    @Field()
    email!: string;
    @Field()
    username!: string;
    @Field()
    password!: string;
}
