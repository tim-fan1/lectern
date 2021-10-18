import make_app from "../index";
import supertest from "supertest";
import { createConnection, getConnection } from "typeorm";
import http from "http";

let app: http.Server;
beforeAll(async () => {
    // setup connection and express app
    await createConnection({
        type: "sqlite",
        database: ":memory:",
        entities: ["src/entities/*.ts"],
        synchronize: true,
        dropSchema: true,
    });
    app = http.createServer(await make_app(getConnection()));
});

beforeEach(async () => {});

afterEach(async () => {
    // clear all entities https://stackoverflow.com/questions/58779347/jest-typeorm-purge-database-after-all-tests
    const entities = getConnection().entityMetadatas;

    for (const entity of entities) {
        const repository = getConnection().getRepository(entity.name); // Get repository
        await repository.clear(); // Clear each entity table's content
    }
});

const sendGraphqlRequest = async (query: string, url = "/graphql") => {
    const request = supertest(app);
    return request
        .post(url)
        .send({
            query: query,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
};

describe("graphql sanity checks", () => {
    test("GET /graphql", async () => {
        const request = supertest(app);
        const res = await request.get("/graphql");
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            errors: [
                {
                    message: "Must provide query string.",
                },
            ],
        });
    });

    test("graphql hello world", async () => {
        let res = await sendGraphqlRequest(
            `query {
              helloWorld
            }`
        );

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            data: {
                helloWorld: "Hello World!",
            },
        });
    });
});
describe("graphql user detail tests", () => {
    test("register test", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        let res = await sendGraphqlRequest(
            `mutation {
              register(
                password: "whats this",
                fname: "${fname}",
                lname: "${lname}",
                # 4 char min :(
                email: "${email}"
              ) {
                errors {
                    msg,
                    kind
                },
                user {
                  email
                  id
                  name
                }
              }
            }`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                data: {
                    register: {
                        errors: [],
                        user: {
                            email: email,
                            name: `${fname} ${lname}`,
                            id: expect.any(Number),
                        },
                    },
                },
            })
        );
    });
});
