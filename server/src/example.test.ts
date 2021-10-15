import request from "supertest";
import make_app from "./index";

function sum(a: number, b: number): number {
    return a + b;
}

test("add two numbers", () => {
    expect(sum(1, 2)).toBe(3);
});


// https://gist.github.com/Ciantic/be6a8b8ca27ee15e2223f642b5e01549
// might be useful
test("graphql basic test", async () => {
    // register a user
    const app = await make_app();

    let req = await request(app)
        .post("/graphql")
        .send({
            query: `
                mutation {
                  register(
                    password: "whats this",
                    username: "owowo",
                    # 4 char min :(
                    email: "uwu@hewwo.com"
                  ) {
                    success,
                    msg
                  }
                }`
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
    expect(req.text)
    console.log(req.text)







})