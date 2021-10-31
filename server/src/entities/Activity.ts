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
import { Session } from "./entities";

@ObjectType()
@Entity()
export default class Activity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field(() => Session)
    @ManyToOne(() => Session, (session) => session.activities)
    session!: Session;
}
