import path from "path";
import cors from "cors";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";

import {
    HelloResolver,
    InstructorResolver,
    UserResolver,
} from "./resolvers/resolvers";
import { Instructor, User, LoginSession } from "./entities/entities";
import cookieParser from "cookie-parser";
import AuthMiddleware from "./middleware/AuthMiddleware";
import config from "./config";

(async function () {
    const schema = await buildSchema({
        resolvers: [HelloResolver, InstructorResolver, UserResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
    });

    const connection = await createConnection({
        // replace this with ormconfig.json later (tm)
        type: "sqlite",
        database: "owo.db",
        entities: [Instructor, User, LoginSession],
    });

    // real fudge - will create tables, kinda bad though in production
    await connection.synchronize();

    const app = express();
    const port = 4000;

    app.use(cors());

    app.use(cookieParser());

    // our auth middleware
    app.use(AuthMiddleware(connection));

    app.use(
        "/graphql",
        graphqlHTTP((req, res) => {
            return {
                schema: schema,
                graphiql: config.isProduction,
                context: {
                    req: req,
                    res: res,
                    conn: connection,
                },
            };
        })
    );

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
})();
