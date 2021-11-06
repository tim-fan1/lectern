import { Field, Int, ObjectType } from "type-graphql";
import { Column, Entity } from "typeorm";
import Choice from "./Choice";

@ObjectType()
@Entity()
export default class QuizChoice extends Choice {
    @Field()
    @Column()
    isCorrect!: boolean;

    @Field(() => Int)
    @Column()
    votes: number = 0;
}
