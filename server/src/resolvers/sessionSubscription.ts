import {
    Arg,
    Ctx,
    Mutation,
    Resolver,
    Root,
    Subscription,
    PubSub,
    PubSubEngine,
    Int,
} from "type-graphql";
import { AuthedContext, Context, EndpointResponse } from "../types";
import CheckAuth from "../utils/authMiddleware";
import LiveSession from "../utils/liveSession";
import { SessionErrors, SessionResponse } from "./session";

/* Function to convert an id to a topic string */
const topic = (id: number): string => "SESSION_" + id.toString();

@Resolver()
export default class SessionSubscriptionResolver {
    @Subscription(() => SessionResponse, {
        topics: ({ args }) => topic(args.id),
    })
    async sessionSubscription(
        @Arg("id", () => Int) id: number,
        @Root() payload: LiveSession
    ): Promise<SessionResponse> {
        // not sure about how to reject a subscription? maybe if the frontend
        // sees that an error is returned, it should end it from its side?

        // just found out that this'll still sub to a topic, but if nothing
        // is broadcast the client will be left hanging. that should be fine
        // since the actual frontend will get valid ids from sessionDetails
        if (payload.session.state === "archived")
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_CLOSED,
            });

        return { errors: [], session: payload.session };
    }

    /* example of an interaction that works on live sessions -- increments the
     * numJoined attr of the relevant session (which only exists in memory and
     * is not a db column). */
    @Mutation(() => EndpointResponse)
    async testInteraction(
        @Arg("id", () => Int) id: number,
        @Ctx() { openSessions }: Context,
        @PubSub() pubsub: PubSubEngine
    ): Promise<EndpointResponse> {
        /* look for this session in openSessions from the context (not db) */
        const thisLive = openSessions.get(id);
        if (thisLive === undefined)
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });

        /* call the relevant LiveSession method (all live ops should be
         * abstracted in this way) */
        thisLive.incrementCount();

        /* publish the entire LiveSession on the relevant topic with this id */
        pubsub.publish(topic(id), thisLive);

        return EndpointResponse.withErrors();
    }

    @Mutation(() => EndpointResponse)
    async pollVote(
        @Arg("id", () => Int) id: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("choiceId", () => Int) choiceId: number,
        @Ctx() { openSessions }: Context,
        @PubSub() pubsub: PubSubEngine
    ) {
        const thisLive = openSessions.get(id);
        if (thisLive === undefined)
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });

        if (!thisLive.pollVote(activityId, choiceId))
            return SessionResponse.withErrors({
                kind: SessionErrors.INVALID_CHOICE,
            });

        pubsub.publish(topic(id), thisLive);

        return EndpointResponse.withErrors();
    }

    @CheckAuth()
    @Mutation(() => SessionResponse)
    async closeSession(
        @Arg("id", () => Int) id: number,
        @Ctx() { openSessions, user }: AuthedContext,
        @PubSub() pubsub: PubSubEngine
    ): Promise<SessionResponse> {
        const thisLive = openSessions.get(id);
        if (thisLive === undefined || thisLive.session.author.id != user.id)
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });

        openSessions.delete(id);
        thisLive.close();

        pubsub.publish(topic(id), thisLive);

        return { errors: [], session: thisLive.session };
    }
}
