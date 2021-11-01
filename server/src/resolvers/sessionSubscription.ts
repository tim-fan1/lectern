import {
    Arg,
    Ctx,
    Mutation,
    Resolver,
    Root,
    Subscription,
    PubSub,
    PubSubEngine,
} from "type-graphql";
import { Context, EndpointResponse } from "../types";
import LiveSession from "../utils/liveSession";
import { SessionErrors, SessionResponse } from "./session";

@Resolver()
export default class SessionSubscriptionResolver {
    @Subscription(() => SessionResponse, {
        topics: ({ args }) => args.id.toString(),
    })
    async sessionSubscription(
        @Arg("id") id: number,
        @Root() payload: LiveSession
    ): Promise<SessionResponse> {
        // not sure about how to reject a subscription? maybe if the frontend
        // sees that an error is returned, it'll end it from its side?
        return { errors: [], session: payload.session };
    }

    @Mutation(() => EndpointResponse)
    async testInteraction(
        @Arg("id") id: number,
        @Ctx() { openSessions }: Context,
        @PubSub() pubsub: PubSubEngine
    ): Promise<EndpointResponse> {
        console.log(openSessions);
        const thisLive = openSessions.get(id);
        if (thisLive === undefined)
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });

        thisLive.incrementCount();
        pubsub.publish(id.toString(), thisLive);

        return EndpointResponse.withErrors();
    }
}
