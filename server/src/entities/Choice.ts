import { Field, InputType, Int, ObjectType } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Activity } from "./entities";

/**
 * InputChoice has the subset of fields in Choice that we can expect users to
 * submit when they're using the addChoices endpoint. This still has the
 * Entity and ObjectType decorators since Choice inherits these fields.
 * This includes all of the fields for all types of activities; drag and drop,
 * quiz, and poll.
 */
@InputType()
@ObjectType()
@Entity()
export class InputChoice {
    @Field()
    @Column()
    name!: string;

    //DnD

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true })
    DnDCorrectPosition?: number;

    @Field(() => [Int], { nullable: true })
    @Column("simple-array", { nullable: true })
    DnDVotes?: number[];

    //Poll

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true })
    PollVotes?: number;

    //Quiz
    @Field({ nullable: true })
    @Column({ nullable: true })
    QuizIsCorrect?: boolean;

    @Field(() => Int, { nullable: true })
    @Column({ nullable: true })
    QuizVotes?: number;
}

/**
 * The Choice entity is used for multi-choice activities (poll, quiz).
 */
@ObjectType()
@Entity()
export default class Choice extends InputChoice {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
