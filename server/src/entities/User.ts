import { Field, Int, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Session } from "./entities";
import LoginSession from "./LoginSession";

@ObjectType()
@Entity()
export default class User {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @CreateDateColumn()
    created!: Date;

    @Field()
    @UpdateDateColumn()
    updated!: Date;

    @Field()
    @Column()
    name!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    //why isn't this exposed as a field? won't the frontend need to know if a user is verified?
    @Column()
    verified!: boolean;

    @OneToMany(() => Session, (session) => session.author, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    sessions!: Session[];

    @OneToMany(() => LoginSession, (s) => s.user)
    loginSessions!: LoginSession[];
}
