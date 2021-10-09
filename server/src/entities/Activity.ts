import { Field, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export default class Activity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;
}