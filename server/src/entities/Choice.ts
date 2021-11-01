import { Field, Int, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
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

    @Field(() => Int)
    @Column()
    votes!: number;

    /* Many choices belong to one activity. */
    @Field(() => Activity)
    @ManyToOne(() => Activity, (activity) => activity.choices)
    activity!: Activity;
}
