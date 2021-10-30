import supertest from "supertest";
import generateAlphanumCode from "../utils/generateCode";
import {
    resetDatabase,
    sendGraphqlRequest,
    testGetAppSingleton,
} from "./test/helpers";

// mock the generate code first, before registering
// this needs to be done in top level scope (as jest will actually hoist
// the mock above the import above
jest.mock("../utils/generateCode");
// some funky type casting to allow ts to understand jest mock
// https://stackoverflow.com/questions/48759035/mock-dependency-in-jest-with-typescript
const mockGenerateAlphanumCode = generateAlphanumCode as jest.MockedFunction<
    typeof generateAlphanumCode
>;
// now, generateAlphanumCode will be mocked with jest's default implementation
// which is () => return undefined. Lets make it use our original implementation
// we can override this in a test later
mockGenerateAlphanumCode.mockImplementation(
    jest.requireActual("../utils/generateCode")
        .default as typeof generateAlphanumCode
);

const RegisterMutation = `
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

const VerifyEmailMutation = `
mutation($verification_code: String!) {
    verify_email(verification_code: $verification_code) {
        errors {
            kind,
            msg
        }
    }
}`;

const LoginMutation = `
mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
        errors {    
            kind,
            msg
        }
    }
}`;

afterEach(async () => {
    await resetDatabase();
});

describe("graphql user detail tests", () => {
    // This function checks if a user response contains a valid
    // representation of a user from the /register register
    const checkUserResponse = (
        user_obj: any,
        { email, fname, lname }: { email: string; fname: string; lname: string }
    ) => {
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
    };

    /// Register a user, and do some basic tests to ensure state is correct
    // after the authentication patch, application errors previously returned
    // top level will be returned further in the object (.data.register.errors)
    // we can just return the data body then as we no longer have to worry
    // about the funny error conditions on the top level
    const registerUser = async (
        fname: string,
        lname: string,
        email: string,
        password: string
    ): Promise<any> => {
        const res = await sendGraphqlRequest(RegisterMutation, {
            fname,
            lname,
            email,
            password,
        });

        return res.body.data.register;
    };

    test("register test", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        const password = "whats this";
        const response = await registerUser(fname, lname, email, password);
        checkUserResponse(response, { email, fname, lname });
    });

    test("register test fail", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        const password = "bad"; // password is too short
        const response = await registerUser(fname, lname, email, password);
        const errors = response.errors;
        expect(errors).toHaveLength(1);
        expect(errors).toContainEqual(
            expect.objectContaining({
                kind: "BAD_PASSWORD",
                msg: expect.any(String),
            })
        );
    });

    test("verification + login test", async () => {
        const fname = "owo";
        const lname = "uwu";
        const email = "uwu@hewwo.com";
        const password = "whats this";

        mockGenerateAlphanumCode.mockReturnValueOnce("owo");
        await registerUser(fname, lname, email, password);

        // shouldn't let you login until verification is complete
        let res = await sendGraphqlRequest(LoginMutation, {
            email,
            password,
        });
        expect(res.body.data.login).toEqual({
            errors: [
                {
                    kind: "USER_UNVERIFIED",
                    msg: "User not verified",
                },
            ],
        });

        // use the wrong verification code
        res = await sendGraphqlRequest(VerifyEmailMutation, {
            verification_code: "uwu",
        });
        expect(res.body.data.verify_email).toEqual({
            errors: [
                {
                    kind: "INVALID_VERIFICATION_CODE",
                    msg: "Invalid verification code",
                },
            ],
        });

        // now test with actual verification code (that we have mocked)
        res = await sendGraphqlRequest(VerifyEmailMutation, {
            verification_code: "owo",
        });
        expect(res.body.data.verify_email.errors).toHaveLength(0);

        // try to login again
        res = await sendGraphqlRequest(LoginMutation, { email, password });
        expect(res.body.data.login.errors).toHaveLength(0);

        // try to login again with a wrong password
        res = await sendGraphqlRequest(LoginMutation, {
            email,
            password: "this is wronger",
        });
        expect(res.body.data.login.errors).toEqual([
            expect.objectContaining({
                kind: "INCORRECT_PASSWORD",
                msg: "Incorrect password",
            }),
        ]);
    });
});
