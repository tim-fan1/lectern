import path from "path";
import cors from "cors";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { Connection, createConnection } from "typeorm";
import { WebSocketServer } from "ws";
import { execute, subscribe } from "graphql";
import { useServer } from "graphql-ws/lib/use/ws";

import {
    HelloResolver,
    UserResolver,
    SessionResolver,
} from "./resolvers/resolvers";
import { User, LoginSession, Session, VerifyEmail } from "./entities/entities";
import cookieParser from "cookie-parser";
import userAuthChecker from "./auth/authChecker";
import config from "./config";

async function make_app(connection: Connection): Promise<express.Express> {
    const schema = await buildSchema({
        resolvers: [HelloResolver, UserResolver, SessionResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
        authChecker: userAuthChecker,
    });
    const app = express();

    app.use(
        cors({
            origin: [config.frontend_url, "https://studio.apollographql.com"],
            credentials: true,
        })
    );

    app.use(cookieParser());

    app.use(
        "/graphql",
        graphqlHTTP((req, res) => {
            return {
                schema: schema,
                context: {
                    req: req,
                    res: res,
                    conn: connection,
                },
            };
        })
    );

    // NOTE - this only works with npm run dev, as the build does not include the necessary html files
    // this serves all files in the graphiql folder
    if (!config.isProduction) {
        app.use(
            express.static("src/graphiql", {
                extensions: ["html"],
            })
        );
    }

    const server = app.listen(4000, () => {
        // Set up the WebSocket for handling GraphQL subscriptions.
        const wsServer = new WebSocketServer({
            server,
            path: "/graphql",
        });

        useServer({ schema }, wsServer);
    });

    return app;
}
const PORT = 4000;

if (require.main === module) {
    // if run directly, execute the app
    // https://nodejs.org/api/modules.html#modules_accessing_the_main_module

    // ah yes, who doesn't like async code on the top level scope
    (async () => {
        const connection = await createConnection({
            // replace this with ormconfig.json later (tm)
            type: "sqlite",
            database: "owo.db",
            entities: [User, LoginSession, Session, VerifyEmail],
        });

        // real fudge - will create tables, kinda bad though in production
        await connection.synchronize();
        const app = await make_app(connection);
        // app.listen(PORT, () => {
        //    console.log(`Server listening on port ${PORT}`);
        //});
    })();
}

export default make_app;
