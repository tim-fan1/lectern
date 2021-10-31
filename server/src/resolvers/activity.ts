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
import Activity from "../entities/Activity";
import { EndpointResponse } from "../types";

@ObjectType()
class ActivityResponse extends EndpointResponse {
    @Field({ nullable: true })
    activity?: Activity;
}

@ObjectType()
class ActivityArrResponse extends EndpointResponse {
    @Field(() => [Activity], { nullable: true })
    activitys?: Activity[];
}

enum ActivityErrors {
    DB_ERROR = "DB_ERROR",
    USER_NOT_EXIST = "USER_NOT_EXIST", // shouldn't be possible but ts complains
    SESSION_NOT_EXIST = "SESSION_NOT_EXIST",
    ACTIVITY_NOT_EXIST = "ACTIVITY_NOT_EXIST",
}

@Resolver()
export default class ActivityResolver {
    @Query(() => ActivityArrResponse)
    async getActivities(
        @Arg("session_id") session_id: String
    ): Promise<ActivityArrResponse> {
        return {
            errors: [],
        };
    }

    @Mutation(() => ActivityResponse)
    async createPoll(
        @Arg("session_id") session_id: String,
        @Arg("name") name: String
    ): Promise<ActivityResponse> {
        return {
            errors: [],
        };
    }

    @Mutation(() => ActivityResponse)
    async addToPoll(
        @Arg("session_id") session_id: String,
        @Arg("activity_id") activity_id: String,
        @Arg("name") name: String
    ): Promise<ActivityResponse> {
        return {
            errors: [],
        };
    }
}
