"use strict";
exports.__esModule = true;
var express_1 = require("express");
var app = (0, express_1["default"])();
var port = 8080;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/api/message", function (_, res) {
    res.json({ message: "Hello there friends!" });
});
app.listen(port, function () {
    // tslint:disable-next-line:no-console
    console.log("server started at http://localhost:" + port);
});
