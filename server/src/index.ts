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

    app.use(cors());

    app.use(cookieParser());

    // auth middleware - should probably go somewhere else
    // this sets res.locals.userId to the id of this user if their session
    // token was valid, otherwise it stays undefined. checking
    // (res.locals.userId !== undefined) is enough to check that this
    // user is logged in
    app.use(async (req, res, next) => {
        res.locals.userId = undefined;
        const token = req.cookies.token;

        console.log("request with token: " + token);

        if (token === undefined) {
            console.log("token is undefined");
            return next();
        }

        try {
            const repo = connection.getRepository(Session);
            const thisSess = await repo.findOne({ token: token });
            if (thisSess === undefined) {
                console.log("couldn't find a session with that token");
                return next();
            }

            console.log("passing userId as " + thisSess.userId);
            res.locals.userId = thisSess.userId;
        } catch (e: Error | any) {
            console.error("(auth) " + e.message);
        }

        return next();
    });

    app.use(
        "/graphql",
        graphqlHTTP((req, res) => {
            return {
                schema: schema,
                graphiql: true, // todo: disable in prod
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
