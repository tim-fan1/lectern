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

type ActivityState = "draft" | "open" | "archived";

/**
 * Activity entity: represents an activity within a session (e.g. a poll,
 * quiz, etc.)
 */
@ObjectType()
@Entity()
export default class Activity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field()
    @Column()
    kind!: string;

    /* Many activities belong to one session. */
    @Field(() => Session)
    @ManyToOne(() => Session, (session) => session.activities)
    session!: Session;

    @Field()
    @Column({ default: "draft" })
    state!: ActivityState;

    /* One poll contains many choices. */
    @Field(() => [Choice])
    @OneToMany(() => Choice, (choice) => choice.activity, {
        /* Always grab the choices relation; activity.choices is never null. */
        eager: true,
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    choices!: Choice[];
}
