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

@ObjectType()
@Entity()
export default class QnA {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => Session)
    @OneToOne(() => Session, (session) => session.qna)
    session!: Session;

    @Field(() => Question)
    @OneToMany(() => Question, (question) => question.QnA, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    questions!: Question[];

    @Field()
    open!: boolean;
}
