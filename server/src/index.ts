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
    ActivityResolver,
    SessionSubscriptionResolver,
    GroupResolver,
} from "./resolvers/resolvers";
import {
    User,
    LoginSession,
    Session,
    Activity,
    Choice,
} from "./entities/entities";
import cookieParser from "cookie-parser";
import config from "./config";
import LiveSession from "./utils/liveSession";
import { PubSub, PubSubEngine } from "graphql-subscriptions";
import QnA from "./entities/QnA";

async function makeApp(
    schema: GraphQLSchema,
    connection: Connection,
    pubsub: PubSubEngine
): Promise<express.Express> {
    console.log(new QnA());

    const app = express();

    const openSessions = await getOpenSessions(connection, pubsub);

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
                    openSessions: openSessions,
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
            entities: [User, LoginSession, Session, Activity, Choice],
        });

        /* manually create the pubsub here so we can use it in getOpenSessions */
        const pubsub = new PubSub();

        const schema = await buildSchema({
            resolvers: [
                HelloResolver,
                UserResolver,
                SessionResolver,
                SessionSubscriptionResolver,
                ActivityResolver,
                GroupResolver,
            ],
            emitSchemaFile: path.resolve(__dirname, "schema.gql"),
            pubSub: pubsub,
        });

        // real fudge - will create tables, kinda bad though in production
        await connection.synchronize();
        const app = await makeApp(schema, connection, pubsub);

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

/* Gets all the sessions that are currently open from the database, and returns
 * an in-mem map of them all (mostly useful for debugging, but maybe prod too) */
async function getOpenSessions(
    conn: Connection,
    pubsub: PubSubEngine
): Promise<Map<number, LiveSession>> {
    const map = new Map();
    await conn
        .getRepository(Session)
        .find({ where: { state: "open" }, relations: ["author"] })
        .then((ss) =>
            ss.map((s) => map.set(s.id, new LiveSession(conn, pubsub, s)))
        );
    return map;
}

export default makeApp;
