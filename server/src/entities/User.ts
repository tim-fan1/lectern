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

/**
 * User entity: represents an authenticated user (an instructor.)
 */
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

    @Column()
    verified!: boolean;

    @OneToMany(() => Session, (session) => session.author, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    sessions!: Session[];

    @OneToMany(() => LoginSession, (s) => s.user, { cascade: true })
    loginSessions!: LoginSession[];

    /* Used for verification or reset codes on this user; only really makes
     * sense to have one of either active at any time. For now, if the user
     * is unverified, this contains the verification code and they cannot
     * reset their password; otherwise if there's an active reset code then
     * it will be overwritten when they go to reset their password.
     * fun stuff:
     * https://stackoverflow.com/questions/64635617/how-to-set-a-nullable-database-field-to-null-with-typeorm */
    @Column({ type: "text", nullable: true })
    verifyResetCode!: string | null;

    @Field()
    @Column()
    bio: string = "";

    @Field()
    @Column()
    pic!: string;
}
