import { Query, Resolver } from "type-graphql";

@Resolver()
export default class SessionResolver {
    @Query(() => String)
    async helloWorld() {
        return "Hello World!";
    }
}
