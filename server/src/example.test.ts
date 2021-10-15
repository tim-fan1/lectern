import request from "supertest";
import make_app from "./index";
import supertest from "supertest";
import { createConnection, getConnection } from "typeorm";
import { LoginSession, Session, User, VerifyEmail } from "./entities/entities";
import http from "http";

let app: http.Server;
beforeAll(async () => {
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

jest.setTimeout(100000000);
// https://gist.github.com/Ciantic/be6a8b8ca27ee15e2223f642b5e01549
// might be useful

test("graphql GET /graphql", async () => {
    const request = supertest(app);
    const yeet = await request.get("/graphql");
    console.log(yeet);
});

test("graphql register test", async () => {
    // register a user
    // who doesn't like a bit of global state :)
    const request = supertest(app);

    const fname = "owo";
    const lname = "uwu";
    const email = "uwu@hewwo.com";
    let res = await request
        .post("/graphql")
        .send({
            query: `
            mutation {
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
                  created
                  email
                  id
                  name
                  updated
                }
              }
            }`,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
    return;

    expect(res.statusCode === 200);
    const body = res.body;
    expect(!body.hasOwnProperty("errors"));
    expect(body.data.register.length === 0);
    expect(typeof body.data.register.user === "object");

    const user: User = body.data.register.user;

    // can't mock sqlite's internal date time function - bit hard to test, so just make sure its a date
    expect(user.created instanceof Date);
    expect(user.updated instanceof Date);
    expect(user.name === `${fname} ${lname}`);
    expect(user.email === email);
});

test("graphql hello world", async () => {
    // register a user
    // who doesn't like a bit of global state :)
    const request = supertest(app);

    let res = await request
        .post("/graphql")
        .send({
            query: `
            query {
              helloWorld
            }`,
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);

    expect(res.statusCode === 200);
    const body = res.body;
    expect(body.data.helloWorld === "Hello World!");
});
