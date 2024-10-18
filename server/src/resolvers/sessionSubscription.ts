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
import {
    AuthedContext,
    Context,
    EndpointResponse,
    left,
    right,
} from "../types";
import CheckAuth from "../utils/authMiddleware";
import LiveSession, { topic } from "../utils/liveSession";
import { SessionErrors, SessionResponse } from "./session";
import modifySession from "../utils/modifySession";
import ActivityResolver, { ActivityKinds } from "./activity";

/**
 * SessionSubscription resolver: some endpoints relating to real-time session
 * functionality, most importantly including the actual subscription.
 */
@Resolver()
export default class SessionSubscriptionResolver {
    @Subscription(() => SessionResponse, {
        topics: ({ args }) => topic(args.id),
    })
    async sessionSubscription(
        @Arg("id", () => Int) id: number,
        @Root() payload: LiveSession
    ): Promise<SessionResponse> {
        // if the id is invalid the client will still sub to a topic, but if nothing
        // is broadcast the client will be left hanging. that should be fine
        // since the actual frontend will get valid ids from sessionDetails
        if (payload.getSession().state === "archived")
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_CLOSED,
            });

        return { errors: [], session: payload.getSession() };
    }

    /* example of an interaction that works on live sessions -- increments the
     * numJoined attr of the relevant session (which only exists in memory and
     * is not a db column). */
    @Mutation(() => EndpointResponse)
    async testInteraction(
        @Arg("id", () => Int) id: number,
        @Ctx() { openSessions }: Context
    ): Promise<EndpointResponse> {
        /* use modifySession to make necessary changes (see its jsdoc) */
        const result = await modifySession(
            openSessions,
            { id: id },
            /* the third argument is a function which returns a modified sess */
            (session) => {
                session.numJoined++;
                return right(session);
            }
        );

        /* see Either docs in types.ts; left means there was an error */
        if (result.isLeft) return EndpointResponse.withErrors(result.data);

        return EndpointResponse.withErrors();
    }

    @Mutation(() => EndpointResponse)
    async activityVote(
        @Arg("sessionId", () => Int) id: number,
        @Arg("activityId", () => Int) activityId: number,
        @Arg("choiceId", () => Int) choiceId: number,
        @Ctx() { openSessions }: Context,
        @Arg("DnDPosition", () => Int, { nullable: true }) DnDPosition?: number
    ) {
        const result = await modifySession(
            openSessions,
            { id: id },
            (session) => {
                const activity = session.activities.find(
                    (a) => a.id === activityId
                );
                if (activity === undefined)
                    return left({ kind: SessionErrors.INVALID_ACTIVITY });

                if (activity.state !== "open") {
                    return left({
                        kind: SessionErrors.INVALID_ACTIVITY,
                        msg: "Activity state is not open for voting",
                    });
                }

                const choice = activity.choices.find((c) => c.id === choiceId);
                if (choice === undefined)
                    return left({ kind: SessionErrors.INVALID_CHOICE });

                if (activity.kind === ActivityKinds.POLL) {
                    if (
                        choice.PollVotes === null ||
                        choice.PollVotes === undefined
                    ) {
                        return left({ kind: SessionErrors.INVALID_CHOICE });
                    }

                    choice.PollVotes++;
                }

                if (activity.kind === ActivityKinds.QUIZ) {
                    if (
                        choice.QuizVotes === null ||
                        choice.QuizVotes === undefined
                    ) {
                        return left({ kind: SessionErrors.INVALID_CHOICE });
                    }

                    choice.QuizVotes++;
                }

                if (activity.kind === ActivityKinds.DND) {
                    if (
                        choice.DnDVotes === undefined ||
                        DnDPosition === undefined ||
                        choice.DnDVotes.length <= DnDPosition
                    ) {
                        return left({
                            kind: SessionErrors.INVALID_CHOICE,
                            msg: "You may need to provide a DnDPosition",
                        });
                    }

                    choice.DnDVotes[DnDPosition]++;
                }

                return right(session);
            }
        );

        if (result.isLeft) return EndpointResponse.withErrors(result.data);
        else return EndpointResponse.withErrors();
    }

    @CheckAuth()
    @Mutation(() => SessionResponse)
    async closeSession(
        @Arg("id", () => Int) id: number,
        @Ctx() { openSessions, user }: AuthedContext,
        @PubSub() pubsub: PubSubEngine
    ): Promise<SessionResponse> {
        const result = await modifySession(
            openSessions,
            { id: id },
            (session) => {
                if (session.author.id !== user.id)
                    return left({
                        kind: SessionErrors.SESSION_NOT_EXIST,
                    });
                if (session.state !== "open")
                    return left({
                        kind: SessionErrors.SESSION_INVALID_STATE,
                    });

                /* Close all activities within the session */
                for (let activity of session.activities) {
                    if (activity.state === "open") activity.state = "archived";
                }

                return right(session);
            },
            ["author"]
        );

        if (result.isLeft) return SessionResponse.withErrors(result.data);

        const thisLive = openSessions.get(id);
        if (thisLive === undefined)
            return SessionResponse.withErrors({
                kind: SessionErrors.SESSION_NOT_EXIST,
            });

        openSessions.delete(id);
        thisLive.close();

        pubsub.publish(topic(id), thisLive);

        return { errors: [], session: thisLive.getSession() };
    }
}
