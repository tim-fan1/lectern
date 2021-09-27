import express from "express";

const app = express();
const port = 8080;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/api/message", (_, res) => {
    res.json({ message: "Hello there!" })
})

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${ port }`);
});
