import { getManager } from "typeorm";
import { createConnection } from "typeorm";
import { graphqlHTTP } from "express-graphql";
import express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import * as path from "path";
import HelloResolver from "./resolvers/hello";
import { InstructorResolver } from "./resolvers/instructor";
import Instructor from "./entities/Instructor";
import { Request, Response } from "express";
import UserResolver from "./resolvers/user";
import User from "./entities/User";

async function main() {
    const schema = await buildSchema({
        resolvers: [HelloResolver, InstructorResolver, UserResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
    });

    const connection = await createConnection({
        // replace this with ormconfig.json later (tm)
        // also registers it in a global fashion so you can getConnection() from anywhere
        type: "sqlite",
        database: "owo.db",
        entities: [Instructor, User],
    });
    const manager = getManager();

    // real fudge - will create tables, kinda bad though in production
    await connection.synchronize();

    const app = express();
    const port = 4000;

    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.use(
        "/graphql",
        graphqlHTTP({
            schema: schema,
            graphiql: true,
            context: (req: Request, res: Response) => ({ req, res }),
        })
    );

    app.listen(port, () => {
        console.log(`Example listening on port ${port}`);
    });
}

main();
