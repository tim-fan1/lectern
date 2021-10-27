import makeApp from "../index";
import supertest from "supertest";
import { createConnection, getConnection } from "typeorm";
import http from "http";
import User from "../entities/User";
import { buildSchema } from "type-graphql";
import { HelloResolver, SessionResolver, UserResolver } from "./resolvers";
import path from "path";
import userAuthChecker from "../auth/authChecker";

let app: http.Server;
beforeAll(async () => {
    // setup connection and express app
    const connection = await createConnection({
        type: "sqlite",
        database: ":memory:",
        entities: ["src/entities/*.ts"],
        synchronize: true,
        dropSchema: true,
    });

    const schema = await buildSchema({
        resolvers: [HelloResolver, UserResolver, SessionResolver],
        authChecker: userAuthChecker,
    });

    app = http.createServer(await makeApp(schema, connection));
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
    /// Register a user, and do some basic tests to ensure state is correct
    const registerUser = async (
        fname: string,
        lname: string,
        email: string,
        password: string
    ): Promise<User> => {
        const res = await sendGraphqlRequest(
            `mutation {
              register(
                password: "${password}",
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
        return res.body.data.register.user;
    };
    test("register test", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        const password = "whats this";
        await registerUser(fname, lname, email, password);
    });

    test("verification test", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        const password = "whats this";
        await registerUser(fname, lname, email, password);

        let res = await sendGraphqlRequest(`
        mutation {
            login(email: "${email}", password: "${password}") {
                errors {    
                    kind,
                    msg
                }
            }
        }`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            // ? why are the errors returned in data
            data: {
                login: {
                    errors: [
                        {
                            kind: "USER_UNVERIFIED",
                            msg: "User not verified",
                        },
                    ],
                },
            },
        });
    });
});
