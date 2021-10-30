import {
    checkUserResponse,
    createUser,
    LoginMutation,
    mockGenerateAlphanumCode,
    RegisterMutation,
    registerUser,
    resetDatabase,
    sendGraphqlRequest,
    VerifyEmailMutation,
} from "./test/helpers";

afterEach(async () => {
    await resetDatabase();
});

describe("graphql user detail tests", () => {
    // This function checks if a user response contains a valid
    // representation of a user from the /register register

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

    test("login test", async () => {
        const email = "owo@uwu.com";
        const password = "password";
        const user = await createUser(email, "john", "smith", password);
        // try to login again
        let res = await sendGraphqlRequest(LoginMutation, { email, password });
        expect(res.body.data.login.errors).toHaveLength(0);
    });
});
