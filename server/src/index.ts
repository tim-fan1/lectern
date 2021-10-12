import path from "path";
import cors from "cors";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";

import {
    HelloResolver,
    UserResolver,
    SessionResolver,
} from "./resolvers/resolvers";
import { User, LoginSession, Session, VerifyEmail } from "./entities/entities";
import cookieParser from "cookie-parser";
import userAuthChecker from "./auth/authChecker";
import config from "./config";

(async function () {
    const schema = await buildSchema({
        resolvers: [HelloResolver, UserResolver, SessionResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
        authChecker: userAuthChecker,
    });

    const connection = await createConnection({
        // replace this with ormconfig.json later (tm)
        type: "sqlite",
        database: "owo.db",
        entities: [User, LoginSession, Session, VerifyEmail],
    });

    // real fudge - will create tables, kinda bad though in production
    await connection.synchronize();

    const app = express();
    const port = 4000;

    app.use(cors({ origin: config.frontend_url, credentials: true }));

    app.use(cookieParser());

    app.use(
        "/graphql",
        graphqlHTTP((req, res) => {
            return {
                schema: schema,
                graphiql: !config.isProduction,
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
