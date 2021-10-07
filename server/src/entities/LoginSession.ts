import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class LoginSession {
    @PrimaryColumn()
    token!: string;

    @CreateDateColumn()
    created!: Date;

    @Column()
    userId!: number;
}
