import supertest from "supertest";
import {
    createUser,
    LoginMutation,
    resetDatabase,
    sendGraphqlRequest,
    TEST_HOST,
    testGetAppSingleton,
} from "./test/helpers";
import { CookieAccessInfo } from "cookiejar";
import { CreateSessionsSession } from "./session.test";

const email = "test@gmail.com";
const password = "test1234";
const fname = "yes";
const lname = "no";
const userFullName = `${fname} ${lname}`;

const GetGroupsQuery = `
query {
    getGroups {
        errors {
            kind,
            msg
        },
        groups
    }
}`;

describe("graphql group tests", () => {
    let supertest_authenticated: supertest.SuperTest<supertest.Test>;
    let loginCookie: string;

    afterEach(async () => {
        await resetDatabase();
    });

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
        loginCookie = supertest_authenticated.jar
            .getCookie("token", access_info)!
            .toString();
    });

    test("no groups", async () => {
        let res = await sendGraphqlRequest(
            GetGroupsQuery,
            {},
            { supertest_obj: supertest_authenticated }
        ).set("Cookie", loginCookie);
        expect(res.body.data.getGroups.errors).toHaveLength(0);
        expect(res.body.data.getGroups.groups).toEqual([]);
    });

    test("single group", async () => {
        const testGroup = "test-group";
        let res = await sendGraphqlRequest(CreateSessionsSession, {name: "oof", group: testGroup}).set(
            "Cookie",
            loginCookie
        );
        expect(res.body.data.createSession.errors).toHaveLength(0);

        res = await sendGraphqlRequest(
            GetGroupsQuery,
            {},
            { supertest_obj: supertest_authenticated }
        ).set("Cookie", loginCookie);
        expect(res.body.data.getGroups.errors).toHaveLength(0);
        expect(res.body.data.getGroups.groups).toEqual([testGroup]);
    });
});
