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
    @Column({ nullable: true })
    DnDCorrectPosition?: number;

    @Field(() => [Number], { nullable: true })
    @Column("simple-array", { nullable: true })
    DnDVotes?: number[];

    //Poll

    @Field({ nullable: true })
    @Column({ nullable: true })
    PollVotes?: number;

    //Quiz
    @Field({ nullable: true })
    @Column({ nullable: true })
    QuizIsCorrect?: boolean;

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true })
    QuizVotes?: number;

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
