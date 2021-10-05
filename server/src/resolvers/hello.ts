import { Query, Resolver } from "type-graphql";

/*
Resolvers tell Type-Graphql how to "serialise" an object. Works in addition to @field'd objects

Queries represent a 'view' into the data
Mutations represent a state-changing operation

The implements is optional (thanks typescript)

Don't forget to add to the resolvers list if more are added
*/

@Resolver()
export default class HelloResolver {
  @Query(() => String)
  async helloWorld() {
    return "Hello World!";
  }
}
