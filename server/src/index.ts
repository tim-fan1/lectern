import { getManager } from "typeorm";
import { createConnection } from "typeorm";
import { graphqlHTTP } from "express-graphql";
import express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import * as path from "path";
import HelloResolver from "./resolvers/hello";
import { InstructorResolver } from "./resolvers/instructor";
import Instructor from "./entities/Instructor";

async function main() {
  const schema = await buildSchema({
    resolvers: [HelloResolver, InstructorResolver],
    emitSchemaFile: path.resolve(__dirname, "schema.gql"),
  });

  const connection = await createConnection({
    // replace this with ormconfig.json later (tm)
    // also registers it in a global fashion so you can getConnection() from anywhere
    type: "sqlite",
    database: "owo.db",
    entities: [Instructor],
  });
  const manager = getManager();

  // real fudge - will create tables, kinda bad though in production
  await connection.synchronize();

  const app = express();
  const port = 4000;

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use(
    "/graphql",
    graphqlHTTP({
      schema: schema,
      graphiql: true,
    })
  );

  app.listen(port, () => {
    console.log(`Example listening on port ${port}`);
  });
}

main();
