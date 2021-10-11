import { Field, Int, ObjectType } from "type-graphql";
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
    @Field(() => Int)
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

    @Field({ nullable: true })
    @Column({ nullable: true })
    startTime?: Date;

    @Field({ nullable: true })
    @Column({ nullable: true })
    endTime?: Date;

    // @Field(() => [Activity])
    // @Column({ default: [] })
    savedActivities?: Activity[];

    // @Field(() => [Activity])
    // @Column({ default: [] })
    activeActivities!: Activity[];

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
