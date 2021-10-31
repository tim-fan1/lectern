import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import User from "./User";

@Entity()
export default class LoginSession {
    @PrimaryColumn()
    token!: string;

    @CreateDateColumn()
    created!: Date;

    @ManyToOne(() => User, (user) => user.sessions, { eager: true })
    user!: User;
}
