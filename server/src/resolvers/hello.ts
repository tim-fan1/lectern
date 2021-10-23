import {
    Arg,
    Field,
    ID,
    Mutation,
    ObjectType,
    Publisher,
    PubSub,
    Query,
    Resolver,
    Root,
    Subscription,
} from "type-graphql";

/*
Resolvers tell Type-Graphql how to "serialise" an object. Works in addition to @field'd objects

Queries represent a 'view' into the data
Mutations represent a state-changing operation

The implements is optional (thanks typescript)

Don't forget to add to the resolvers list if more are added
*/
@ObjectType()
class BikeSheddingStatus {
    @Field((type) => ID)
    id!: number;

    @Field()
    groupName: string;

    @Field()
    isBikeShedding!: boolean;

    constructor(id: number, groupName: string, isBikeShedding: boolean) {
        this.isBikeShedding = isBikeShedding;
        this.id = id;
        this.groupName = groupName;
    }
}

const globalBike = new BikeSheddingStatus(0, "DFM, LLC", false);

/// Represents a change in the BikeShedStatus
/// Doesn't have to have all the attributes
interface BikeSheddingPayload {
    id: number;
    isBikeShedding: boolean;
}

@Resolver()
export default class HelloResolver {
    @Query(() => String)
    async helloWorld() {
        return "Hello World!";
    }

    @Subscription((type) => BikeSheddingStatus, {
        topics: "BIKESHED",
        //filter: ({payload, args}) => true,
    })
    bikeShedSubscription(@Root() notificationPayload: BikeSheddingPayload) {
        // take in the BikeSheddingPayload, and return it
        return {
            ...notificationPayload,
            groupName: globalBike.groupName,
        };
    }

    @Mutation((returns) => Boolean)
    async bikeSheddingMutation(
        @PubSub("BIKESHED") publish: Publisher<BikeSheddingPayload>,
        @Arg("isBikeShedding") isBikeShedding: boolean
    ) {
        globalBike.isBikeShedding = isBikeShedding;
        console.log({
            id: globalBike.id,
            isBikeShedding: globalBike.isBikeShedding,
        });
        await publish({
            id: globalBike.id,
            isBikeShedding: globalBike.isBikeShedding,
        });
        return false;
    }

    @Query((returns) => BikeSheddingStatus)
    bikeShedding() {
        return globalBike;
    }
}
