import { Field, Int, ObjectType } from "type-graphql";
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";

@ObjectType()
@Entity()
class Question {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    question!: string;

    @Field()
    @Column()
    read!: boolean;

    @Field()
    @Column()
    authorName!: string;

    @Field(() => QnA)
    @ManyToOne(() => QnA, (qna) => qna.questions)
    QnA!: QnA;
}

@ObjectType()
@Entity()
export default class QnA {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => Question)
    @OneToMany(() => Question, (question) => question.QnA, {
        orphanedRowAction: "delete",
        cascade: true,
        nullable: false,
    })
    questions: Question[] = [];
    @Field()
    open: boolean;
}
