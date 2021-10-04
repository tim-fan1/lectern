import { Entity, PrimaryGeneratedColumn, Column, getConnection, getManager } from "typeorm";
import { createConnection, Connection } from "typeorm";
import { graphqlHTTP } from 'express-graphql';
import express from "express";
import "reflect-metadata";
import { buildSchema, Resolver, Query, ObjectType, 
    Field, ResolverInterface, Arg, Root, FieldResolver, Mutation } from "type-graphql";
import * as path from "path";
import { FragmentsOnCompositeTypesRule } from "graphql";

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
class Instructor {
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    name!: string;

    @Field(type => Boolean, {nullable: true})
    hasPurposeInLife!: boolean;
}


/*
Resolvers tell Type-Graphql how to "serialise" an object. Works in addition to @field'd objects

Queries represent a 'view' into the data
Mutations represent a state-changing operation

The implements is optional (thanks typescript)

Don't forget to add to the resolvers list if more are added
*/
@Resolver()
class HelloResolver {
  @Query(() => String)
  async helloWorld() {
    return "Hello World!";
  }
}

@Resolver(of => Instructor)
class InstructorResolver implements ResolverInterface<Instructor> {
    private hash(str: string): number {
        var hash = 0;
        if (str.length == 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    @Query(returns => Instructor, { nullable: true })
    async testInstructor(@Arg("name") name: string): Promise<Instructor | undefined> {
        return {
            id: 0,
            name: name,
            hasPurposeInLife: this.hash(name) % 2 === 0,
        }
    }

    @FieldResolver()
    async name(@Root() root: Instructor) : Promise<string> {
        return root.name;
    }

    @Mutation(returns => Instructor)
    async addInstructor(@Arg("name") name: string): Promise<Instructor> {
        const connection = getConnection();
        const repository = connection.getRepository(Instructor);

        const newInstructor = repository.create({
            name: name,
            hasPurposeInLife: this.hash(name) % 2 === 0,
        });

        await repository.save(newInstructor);
        return newInstructor;
    }
}


async function main () {
    const schema = await buildSchema({
        resolvers: [HelloResolver, InstructorResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
    });
    const connection = await createConnection({
        // replace this with ormconfig.json later (tm)
        // also registers it in a global fashion so you can getConnection() from anywhere
        type: "sqlite",
        database: "owo.db",
        entities: [Instructor]
    });
    const manager = getManager();


    // real fudge - will create tables, kinda bad though in production
    await connection.synchronize();

    const app = express();
    const port = 3000;

    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true,
    }));

    app.listen(port, () => {
        console.log(`Example listening on port ${port}`);
    });
}

main();


