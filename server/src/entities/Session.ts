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
import { User, Activity } from "./entities";

type SessionState = "draft" | "open" | "archived";

@ObjectType()
@Entity()
export default class Session {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    /* Many sessions belong to one user. */
    @Field(() => User)
    @ManyToOne(() => User, (user) => user.sessions)
    author!: User;

    @Field()
    @CreateDateColumn()
    created!: Date;

    @Field()
    @UpdateDateColumn()
    updated!: Date;

    @Field()
    @Column({ default: "draft" })
    state!: SessionState;

    @Field({ nullable: true })
    @Column({ nullable: true })
    startTime?: Date;

    @Field({ nullable: true })
    @Column({ nullable: true })
    endTime?: Date;

    /* One session contains many activities. */
    @OneToMany(() => Activity, (activity) => activity.session, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    activities!: Activity[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    group?: string;

    @Field()
    @Column()
    name!: string;

    @Field({ nullable: true })
    @Column({ unique: true, nullable: true })
    code?: string;
}
