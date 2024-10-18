import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import User from "./User";

/**
 * Login session entity: represents an instructor's login session
 */
@Entity()
export default class LoginSession {
    @PrimaryColumn()
    token!: string;

    @CreateDateColumn()
    created!: Date;

    @ManyToOne(() => User, (user) => user.sessions, { eager: true })
    user!: User;
}
