import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ObjectType, Field } from "type-graphql";
/*
Explaination 
Entity() - from TypeORM. Tells the ORM that this object maps to an object in the database
ObjectType() - from Type-Graphql. Tells Type-Graphql that we want to use this type in our graphql API

@PrimaryGeneratedColumn() - from TypeORM. Maps to primary key in database
@Field() - from Type-Graphql. Automatically includes this field when we serialise this object when sending it through graphql
@Column() - from TypeORM - include this as a database column

Don't forget to add to the entity list of the connection
*/

@Entity()
@ObjectType({ description: "object that represents an account" })
export default class Instructor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  name!: string;

  @Field((type) => Boolean, { nullable: true })
  hasPurposeInLife!: boolean;
}
