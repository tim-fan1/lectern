import supertest from "supertest";
import {
    resetDatabase,
    sendGraphqlRequest,
    testGetAppSingleton,
} from "./test/helpers";

afterEach(async () => {
    await resetDatabase();
});

describe("graphql sanity checks", () => {
    test("GET /graphql", async () => {
        const request = supertest(await testGetAppSingleton());
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

        expect(res.body).toEqual({
            data: {
                helloWorld: "Hello World!",
            },
        });
    });
});
