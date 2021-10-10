import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class LoginSession {
    @PrimaryColumn()
    token!: string;

    @CreateDateColumn()
    created!: Date;

    /* TODO use a relation here */
    @Column()
    userId!: number;
}
