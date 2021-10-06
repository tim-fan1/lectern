import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class Session {
    @PrimaryColumn()
    token!: string;

    @CreateDateColumn()
    created!: Date;

    @Column()
    userId!: number;
}
