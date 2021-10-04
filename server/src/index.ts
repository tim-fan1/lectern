import { graphqlHTTP } from 'express-graphql';
import express from "express";
import "reflect-metadata";
import { buildSchema, Resolver, Query, ObjectType, 
    Field, ResolverInterface, Arg, Root, FieldResolver } from "type-graphql";
import * as path from "path";

@ObjectType({ description: "object that represents an account" })
class Instructor {
    @Field()
    name!: string;

    @Field(type => Boolean, {nullable: true})
    hasPurposeInLife!: boolean;
}


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
            name: name,
            hasPurposeInLife: this.hash(name) % 2 === 0,
        }
    }

    @FieldResolver()
    async name(@Root() root: Instructor) : Promise<string> {
        return root.name;
    }
}


async function main () {
    const schema = await buildSchema({
        resolvers: [HelloResolver, InstructorResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
    });
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


