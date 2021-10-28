import path from "path";
import cors from "cors";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { Connection, createConnection } from "typeorm";
import { WebSocketServer } from "ws";
import { GraphQLSchema } from "graphql";
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

async function makeApp(
    schema: GraphQLSchema,
    connection: Connection
): Promise<express.Express> {
    const app = express();

    // add apollo studio when not in production mode
    const corsOrigins = config.isProduction
        ? config.frontendUrl
        : [config.frontendUrl, "https://studio.apollographql.com"];
    app.use(
        cors({
            origin: corsOrigins,
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
                    userInfo: { loggedIn: false },
                },
            };
        })
    );

    // NOTE - this only works with npm run dev, as the build does not include the necessary html files
    // this serves all files in the graphiql folder
    if (!config.isProduction) {
        console.log("Serving graphiql interface on /graphiql");
        app.use(
            express.static("src/graphiql", {
                extensions: ["html"],
            })
        );
    }

    return app;
}

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

        const schema = await buildSchema({
            resolvers: [HelloResolver, UserResolver, SessionResolver],
            emitSchemaFile: path.resolve(__dirname, "schema.gql"),
            authChecker: () => false, // TODO this is to filter auth'd eps, remove later
        });

        // real fudge - will create tables, kinda bad though in production
        await connection.synchronize();
        const app = await makeApp(schema, connection);

        const server = app.listen(config.serverPort, () => {
            // Set up the WebSocket for handling GraphQL subscriptions.
            console.log(`Server listening on port ${config.serverPort}`);
            const wsServer = new WebSocketServer({
                server,
                path: "/graphql",
            });

            useServer({ schema }, wsServer);
            console.log(`Started WebSocketServer on port ${config.serverPort}`);
        });
    })();
}

export default makeApp;
