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

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
