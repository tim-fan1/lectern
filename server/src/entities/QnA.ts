import { Field, Int, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Session, Question } from "./entities";

/**
 * Q&A entity: basically a container for all Q&A Questions.
 */
@ObjectType()
@Entity()
export default class QnA {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => Session)
    @OneToOne(() => Session, (session) => session.qna)
    session!: Session;

    @Field(() => [Question])
    @OneToMany(() => Question, (question) => question.QnA, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
        eager: true,
    })
    questions!: Question[];

    @Field()
    @Column()
    open: boolean = false;
}
