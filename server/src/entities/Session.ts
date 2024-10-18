import { Field, Int, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User, Activity, QnA } from "./entities";

type SessionState = "draft" | "open" | "archived";

/**
 * Session entity + GQL type: represents a lectern session.
 */
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
    @Field(() => [Activity])
    @OneToMany(() => Activity, (activity) => activity.session, {
        eager: true,
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    activities!: Activity[];

    @Field(() => QnA)
    @OneToOne(() => QnA, (qa) => qa.session, {
        eager: true,
        orphanedRowAction: "delete",
        nullable: false,
        cascade: true,
    })
    @JoinColumn()
    qna!: QnA;

    @Field({ nullable: true })
    @Column({ nullable: true })
    group?: string;

    @Field()
    @Column()
    name!: string;

    @Field({ nullable: true })
    @Column({ unique: true, nullable: true })
    code?: string;

    @Field(() => Int)
    numJoined: number = 0;
}
