import { createConnection, getConnection } from "typeorm";
import { buildSchema, NonEmptyArray } from "type-graphql";
import * as resolvers from "../resolvers";
import * as entities from "../../entities/entities";
import http from "http";
import makeApp from "../../index";
import supertest, { Test } from "supertest";
import generateAlphanumCode from "../../utils/generateCode";
import { PubSub } from "graphql-subscriptions";

// mock the generate code first, before registering
// this needs to be done in top level scope (as jest will actually hoist
// the mock above the import above
jest.mock("../../utils/generateCode");
// some funky type casting to allow ts to understand jest mock
// https://stackoverflow.com/questions/48759035/mock-dependency-in-jest-with-typescript
export const mockGenerateAlphanumCode =
    generateAlphanumCode as jest.MockedFunction<typeof generateAlphanumCode>;
// now, generateAlphanumCode will be mocked with jest's default implementation
// which is () => return undefined. Lets make it use our original implementation
// we can override this in a test later
mockGenerateAlphanumCode.mockImplementation(
    jest.requireActual("../../utils/generateCode")
        .default as typeof generateAlphanumCode
);

let app: http.Server;
export const testGetAppSingleton = async () => {
    if (app === undefined) {
        const connection = await createConnection({
            type: "sqlite",
            database: ":memory:",
            entities: Object.values(entities),
            synchronize: true,
            dropSchema: true,
        });

        const ps = new PubSub();

        const schema = await buildSchema({
            // I love typescript
            resolvers: Object.values(
                resolvers
            ) as unknown as NonEmptyArray<Function>,
            pubSub: ps,
        });

        app = http.createServer(await makeApp(schema, connection, ps));
    }
    return app;
};

export const TEST_HOST = "https://test.com";

export interface sendGraphqlRequestOpts {
    url?: string;
    supertest_obj?: supertest.SuperTest<supertest.Test>;
}
export const sendGraphqlRequest = (
    query: string,
    args: any = {},
    opts?: sendGraphqlRequestOpts
): Test => {
    let url: string | undefined;
    let supertest_obj: supertest.SuperTest<supertest.Test> | undefined;
    if (opts !== undefined) {
        ({ url, supertest_obj } = opts);
    }
    if (url === undefined) {
        url = "/graphql";
    }
    if (supertest_obj === undefined) {
        // app needs to be defined (testAppSingleton should be called before)
        // however, since it is async it kinda sucks.
        expect(app).toBeDefined();
        supertest_obj = supertest(app);
    }

    return supertest_obj
        .post(url)
        .send({
            query: query,
            variables: args,
        })
        .set("Host", TEST_HOST)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);
};

export const resetDatabase = async () => {
    await getConnection().synchronize(true);
};

export const RegisterMutation = `
mutation($password: String!, $fname: String!, $lname: String!, $email: String!) {
  register(
    password: $password,
    fname: $fname,
    lname: $lname,
    email: $email
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
}`;

export const VerifyEmailMutation = `
mutation($verificationCode: String!) {
    verifyEmail(verificationCode: $verificationCode) {
        errors {
            kind,
            msg
        }
    }
}`;

export const LoginMutation = `
mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
        errors {    
            kind,
            msg
        }
    }
}`;

export const checkUserResponse = (
    user_obj: any,
    { email, fname, lname }: { email: string; fname: string; lname: string }
): { email: string; name: string; id: Number } => {
    expect(user_obj).toEqual(
        expect.objectContaining({
            errors: [],
            user: {
                email: email,
                name: `${fname} ${lname}`,
                id: expect.any(Number),
            },
        })
    );
    let user = user_obj.user;
    return {
        email: user.email,
        name: user.name,
        id: user.id,
    };
};

/// Register a user, and do some basic tests to ensure state is correct
// after the authentication patch, application errors previously returned
// top level will be returned further in the object (.data.register.errors)
// we can just return the data body then as we no longer have to worry
// about the funny error conditions on the top level
export const registerUser = async (
    fname: string,
    lname: string,
    email: string,
    password: string
): Promise<any> => {
    // HACK: we need to set the global app variable
    await testGetAppSingleton();
    const res = await sendGraphqlRequest(RegisterMutation, {
        fname,
        lname,
        email,
        password,
    });

    return res.body.data.register;
};

export const createUser = async (
    email: string,
    fname: string,
    lname: string,
    password: string
) => {
    mockGenerateAlphanumCode.mockReturnValueOnce("owo");
    let response = await registerUser(fname, lname, email, password);
    let user = checkUserResponse(response, { email, fname, lname });
    // verify the account
    response = await sendGraphqlRequest(VerifyEmailMutation, {
        verificationCode: "owo",
    });
    expect(response.body.data.verifyEmail.errors).toHaveLength(0);
    return user;
};
