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
import { Session, Choice } from "./entities";

@ObjectType()
@Entity()
export default class Activity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    /* Many activities belong to one session. */
    @Field(() => Session)
    @ManyToOne(() => Session, (session) => session.activities)
    session!: Session;

    /* One activity contains many choices. */
    @Field(() => [Choice])
    @OneToMany(() => Choice, (choice) => choice.activity, {
        eager: true,
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    choices!: Choice[];
}
