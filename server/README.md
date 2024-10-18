## folder structure

All of the source files are in `src/`, and by default TypeScript will compile and output to `dist/`. Within `src/`, all of our GraphQL API endpoints are defined in `resolvers/`, and our database entities and GraphQL types are defined in `entities/`. `index.ts` is the entry point for the server as a whole.

## server quickstart

To run a development server:

1. `npm run watch` runs `tsc -w` and complies to `/dist`
2. `npm run dev` runs `nodemon /dist/index.js` which just restarts when there are changes to `/dist`

To run a production server:

1. make sure all environment variables are set as needed (see config.ts)
2. `npm run build` runs `tsc`, compiling files and outputting in `dist/`
3. `node dist/index.js` starts the server from the compiled files
