import { Field, ObjectType } from "type-graphql";
import { Column, Entity } from "typeorm";
import Choice from "./Choice";

@ObjectType()
@Entity()
export default class DnDChoice extends Choice {
    @Field()
    @Column()
    correctPosition!: number;

    @Field()
    @Column()
    votes: {} = {};
}
