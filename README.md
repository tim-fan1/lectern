# Lectern.me monorepo

Source code for the `lectern.me` website frontend and server components.
`Lectern` is a lecture/class engagement and participation platform (like Kahoot or Slido).

Created for our UNSW COMP3900 capstone project, written by Tim Fan, Jack Jiang, Brian Nguyen, Eddie Qi, and Ivan Velickovic.

Project group: `3900-w16a-disaggregated-far-memory`

## Quickstart

First ensure that a (reasonably) modern version of `node.js` is installed. `Lectern` requires v12+. A newer version of `node.js` can be installed using the `install_node.sh` script.

### Client
- `cd` into the client directory
- `npm install` the client's dependencies in that directory. This is only required once
- `npm run build` the client's code. This transpiles and optimises our frontend code
- `npm run start` to start the client.

### Server
- `cd` into the server directory
- `npm install` the server's dependencies in that directory. This is only required once
- `npm run build` the server's code. This also transpiles and optimises the backend code
- `npm run start` to start the server.


## Folder structure

`client/` contains our web front-end, written in TypeScript and using Next.js.

`server/` contains the back-end, written in TypeScript and using Express.js.

`diaries/` contains weekly development updates from team members about their contributions

## A note about architecture

Our webapp and server don't communicate through something like a HTTP REST API; rather, they use [GraphQL](https://graphql.org/) as their transport. This fundamentally changes the structure of the codebases, especially on the back-end.

Instead of HTTP routes, the back-end defines API endpoints as either "queries", "mutations", or "subscriptions". In our codebase, each of these endpoints takes the form of a function that is @-decorated, and they are organised into classes called "resolvers".
