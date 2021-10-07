import { Request, Response } from "express";
import { Connection } from "typeorm";

export type Context = {
    req: Request;
    res: Response;
    conn: Connection;
};
