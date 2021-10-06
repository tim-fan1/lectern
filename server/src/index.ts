import path from "path";
import express, { Request, Response } from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";

import {
    HelloResolver,
    InstructorResolver,
    UserResolver,
} from "./resolvers/resolvers";
import { Instructor, User, Session } from "./entities/entities";
import cookieParser from "cookie-parser";

(async function () {
    const schema = await buildSchema({
        resolvers: [HelloResolver, InstructorResolver, UserResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
    });

    const connection = await createConnection({
        // replace this with ormconfig.json later (tm)
        // also registers it in a global fashion so you can getConnection() from anywhere
        type: "sqlite",
        database: "owo.db",
        entities: [Instructor, User, Session],
    });

    // real fudge - will create tables, kinda bad though in production
    await connection.synchronize();

    const app = express();
    const port = 4000;

    app.use(cookieParser());

    app.use(
        "/graphql",
        graphqlHTTP((req, res) => {
            return {
                schema: schema,
                graphiql: true,
                context: {
                    req: req,
                    res: res,
                    conn: connection,
                },
            };
        })
    );

    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
})();
