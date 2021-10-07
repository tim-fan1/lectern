import { NextFunction, Request, Response } from "express";
import { Connection } from "typeorm";
import { LoginSession } from "../entities/entities";

// this middleware sets res.locals.userId to the id of this user
// if their session token was valid, otherwise it stays undefined.
// checking (res.locals.userId !== undefined) is enough to check
// that this user is logged in
export default function (conn: Connection) {
    return async (req: Request, res: Response, next: NextFunction) => {
        res.locals.userId = undefined;
        const token = req.cookies.token;

        if (token === undefined) return next();

        try {
            const repo = conn.getRepository(LoginSession);
            const thisSess = await repo.findOne({ token: token });
            if (thisSess === undefined) return next();

            res.locals.userId = thisSess.userId;
        } catch (e: Error | any) {
            console.error("(auth) " + e.message);
        }

        return next();
    };
}
