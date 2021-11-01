import { Arg, Ctx, Resolver, Subscription } from "type-graphql";
import { Context } from "../types";
import { SessionResponse } from "./session";

@Resolver()
export default class SessionSubscriptionResolver {
    @Subscription(() => SessionResponse, { topics: ({ args }) => args.id })
    async sessionSubscription(
        @Arg("id") id: number,
        @Ctx() {}: Context
    ): Promise<SessionResponse> {
        return SessionResponse.withErrors();
    }
}
