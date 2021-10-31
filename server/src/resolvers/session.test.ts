import {
    createUser,
    LoginMutation,
    registerUser,
    resetDatabase,
    sendGraphqlRequest,
    TEST_HOST,
    testGetAppSingleton,
} from "./test/helpers";
import supertest from "supertest";
import { CookieAccessInfo } from "cookiejar";
import "jest-extended";

afterEach(async () => {
    await resetDatabase();
});

const email = "test@gmail.com";
const password = "test1234";
const fname = "yes";
const lname = "no";
const userFullName = `${fname} ${lname}`;

export const GetSessionsQuery = `
query {
    getSessions {
        errors {
            kind,
            msg
        },
        sessions {
            id,
            #author {
            #    id,
            #    created,
            #    updated,
            #    name,
            #    email
            #}
            created,
            updated,
            state,
            startTime,
            endTime,
            # savedActivities,
            # activeActivites,
            group,
            name,
            code
        }
    }
}`;

export const CreateSessionsSession = `
mutation($name: String!, $group: String) {
    createSession(name: $name, group: $group) {
        errors {
            kind,
            msg
        },
        session {
            id,
            author {
                id,
                created,
                updated,
                name,
                email
            }
            created,
            updated,
            state,
            startTime,
            endTime,
            # savedActivities,
            # activeActivites,
            group,
            name,
            code
        }
    }
}`;
describe("graphql session failures", () => {
    test("get sessions while unverified", async () => {
        // register but not verify the user
        await registerUser("maybe", "yes", email, password);
        let res = await sendGraphqlRequest(GetSessionsQuery, {});
        expect(res.body.data.getSessions.errors).toEqual([
            {
                kind: "NOT_AUTHORISED",
                msg: "You must be logged in to access this.",
            },
        ]);
    });
});

describe("graphql session tests", () => {
    let supertest_authenticated: supertest.SuperTest<supertest.Test>;

    beforeEach(async () => {
        await createUser(email, fname, lname, password);

        // we need the actual supertest object to access the cookies afterwards
        supertest_authenticated = supertest.agent(await testGetAppSingleton());
        // try to login
        let res = await sendGraphqlRequest(
            LoginMutation,
            { email, password },
            { supertest_obj: supertest_authenticated }
        );
        expect(res.body.data.login.errors).toHaveLength(0);
        const access_info = new CookieAccessInfo(TEST_HOST, "/", true);
        expect(
            supertest_authenticated.jar.getCookie("token", access_info)
        ).toEqual(
            expect.objectContaining({
                name: "token",
                value: expect.any(String),
                expiration_date: expect.any(Number),
                path: "/",
            })
        );
    });

    test("get sessions empty", async () => {
        const access_info = new CookieAccessInfo(TEST_HOST, "/", true);

        let res = await sendGraphqlRequest(
            GetSessionsQuery,
            {},
            { supertest_obj: supertest_authenticated }
        ).set(
            "Cookie",
            supertest_authenticated.jar
                .getCookie("token", access_info)!
                .toString()
        );
        expect(res.body.data.getSessions.errors).toHaveLength(0);
        expect(res.body.data.getSessions.sessions).toEqual([]);
    });

    // skip this until get sessions is implemented
    test("get session 1", async () => {
        const access_info = new CookieAccessInfo(TEST_HOST, "/", true);
        const name = "my cool session";
        const group = "uwuers";
        let res = await sendGraphqlRequest(CreateSessionsSession, {
            name: name,
            group: group,
        }).set(
            "Cookie",
            supertest_authenticated.jar
                .getCookie("token", access_info)!
                .toString()
        );
        expect(res.body.data.createSession.errors).toHaveLength(0);
        expect(res.body.data.createSession.session).toEqual(
            expect.objectContaining({
                id: expect.any(Number),
                author: {
                    id: expect.any(Number),
                    created: expect.toBeDateString("DUMB TYPING HACK"),
                    updated: expect.toBeDateString(
                        "This function is declared to need a string"
                    ),
                    name: userFullName,
                    email: email,
                },
                created: expect.toBeDateString(
                    "But it actually takes the string from"
                ),
                updated: expect.toBeDateString(
                    "the object being compared. So this string does " +
                        "nothing, but is required for typing purposes"
                ),
                state: "draft",
                startTime: null,
                endTime: null,
                group: group,
                name: name,
                code: null,
            })
        );
        res = await sendGraphqlRequest(
            GetSessionsQuery,
            {},
            { supertest_obj: supertest_authenticated }
        ).set(
            "Cookie",
            supertest_authenticated.jar
                .getCookie("token", access_info)!
                .toString()
        );
        expect(res.body.data.getSessions.errors).toHaveLength(0);
        expect(res.body.data.getSessions.sessions).toEqual([
            expect.objectContaining({
                id: expect.any(Number),
                created: expect.toBeDateString(
                    "But it actually takes the string from"
                ),
                updated: expect.toBeDateString(
                    "the object being compared. So this string does " +
                        "nothing, but is required for typing purposes"
                ),
                state: "draft",
                startTime: null,
                endTime: null,
                group: group,
                name: name,
                code: null,
            }),
        ]);
    });
});
