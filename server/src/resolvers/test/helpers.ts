// this method creates or gets the app singleton
import { createConnection, getConnection } from "typeorm";
import { buildSchema } from "type-graphql";
import { HelloResolver, SessionResolver, UserResolver } from "../resolvers";
import http from "http";
import makeApp from "../../index";
import supertest from "supertest";

let app: http.Server;
export const testGetAppSingleton = async () => {
    if (app === undefined) {
        const connection = await createConnection({
            type: "sqlite",
            database: ":memory:",
            entities: ["src/entities/*.ts"],
            synchronize: true,
            dropSchema: true,
        });

        const schema = await buildSchema({
            resolvers: [HelloResolver, UserResolver, SessionResolver],
        });

        app = http.createServer(await makeApp(schema, connection));
    }
    return app;
};

export const sendGraphqlRequest = async (
    query: string,
    args: any = {},
    url = "/graphql",
    app?: http.Server
) => {
    if (app === undefined) {
        app = await testGetAppSingleton();
    }
    return supertest(app)
        .post(url)
        .send({
            query: query,
            variables: args,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);
};
export const resetDatabase = async () => {
    // clear all entities https://stackoverflow.com/questions/58779347/jest-typeorm-purge-database-after-all-tests
    const entities = getConnection().entityMetadatas;

    for (const entity of entities) {
        const repository = getConnection().getRepository(entity.name); // Get repository
        await repository.clear(); // Clear each entity table's content
    }
};
