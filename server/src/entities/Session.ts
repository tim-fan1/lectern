import { Field, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./entities";

export interface Activity {
    name: string;
    body: {};
}

type SessionState = "draft" | "open" | "archived";

@ObjectType()
@Entity()
export default class Session {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
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

    @Field()
    @Column()
    startTime!: Date;

    @Field()
    @Column({ nullable: true })
    endTme?: Date;

    @Field()
    @Column({ default: [] })
    savedActivities?: [Activity];

    @Field()
    @Column({ default: [] })
    activeActivities!: [Activity];

    @Field()
    @Column({ nullable: true })
    group?: string;

    @Field()
    @Column()
    name!: string;
}
