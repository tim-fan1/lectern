import { Field, Int, InterfaceType } from "type-graphql";
import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Activity } from "./entities";

@InterfaceType()
export default abstract class Choice {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field(() => Int)
    @Column({ default: 0 })
    votes!: number;

    @Field()
    @Column({ default: false })
    isCorrect!: boolean;

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
