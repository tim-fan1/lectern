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
import { QnA } from "./entities";

/**
 * Question entity: represents a question in a session's Q&A.
 */
@ObjectType()
@Entity()
export default class Question {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @CreateDateColumn()
    created!: Date;

    @Field()
    @Column()
    question!: string;

    @Field()
    @Column()
    read!: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    authorName!: string;

    @Field(() => QnA)
    @ManyToOne(() => QnA, (qna) => qna.questions)
    QnA!: QnA;
}
