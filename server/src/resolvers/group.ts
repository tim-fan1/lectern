import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { AuthedContext, EndpointResponse } from "../types";
import CheckAuth from "../utils/authMiddleware";

@ObjectType()
class MultipleGroupResponse extends EndpointResponse {
    @Field(() => [String], { nullable: true })
    groups?: String[];
}

/**
 * Resolver for endpoints relating to session groups.
 */
@Resolver()
export default class GroupResolver {
    @CheckAuth(["user.sessions"])
    @Query(() => MultipleGroupResponse)
    async getGroups(
        @Ctx() { user }: AuthedContext
    ): Promise<MultipleGroupResponse> {
        // naive solution: loop through all sessions and find unique groups
        return {
            errors: [],
            groups: (
                user.sessions
                    // get .group of all sessions
                    .map((session) => session.group)
                    // filter out the undefined - but type is unchanged so typescript complains
                    .filter((group) => group !== null) as string[]
            )
                // finally, filter all non-unique (findIndex of element in array, if its not matching,
                .filter(
                    (group, i, array) =>
                        array.findIndex((elem) => elem === group) === i
                ),
        };
    }
}
