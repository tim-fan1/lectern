import { Field, Int, ObjectType } from "type-graphql";
import { Column, Entity } from "typeorm";
import Choice from "./Choice";

@ObjectType()
@Entity()
export default class PollChoice extends Choice {
    @Field()
    @Column()
    correctPosition?: number;

    @Field(() => Int)
    @Column()
    votes: number = 0;
}
