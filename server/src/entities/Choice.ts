import { Field, Int, ObjectType } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Activity } from "./entities";

@ObjectType()
@Entity()
export default class Choice {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    //DnD

    @Field({ nullable: true })
    @Column()
    DnDCorrectPosition?: number;

    @Field(() => [Number], { nullable: true })
    @Column("simple-array")
    DnDVotes?: number[];

    //Poll

    @Field({ nullable: true })
    @Column()
    PollVotes?: number;

    //Quiz
    @Field({ nullable: true })
    @Column()
    isCorrect?: boolean;

    @Field(() => Int, { nullable: true })
    @Column()
    QuizVotes?: number;

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
