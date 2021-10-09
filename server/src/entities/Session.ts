import { Field, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User, Activity } from "./entities";

type SessionState = "draft" | "open" | "archived";

@ObjectType()
@Entity()
export default class Session {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

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
    @Column({ default: () => "CURRENT_TIMESTAMP" })
    startTime!: Date;

    @Field({ nullable: true })
    @Column({ nullable: true })
    endTime?: Date;

    // @Field(() => [Activity])
    // @Column({ default: [] })
    savedActivities?: Activity[];

    // @Field(() => [Activity])
    // @Column({ default: [] })
    activeActivities!: Activity[];

    @Field()
    @Column({ nullable: true })
    group?: string;

    @Field()
    @Column()
    name!: string;
}
