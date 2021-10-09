import { Request, Response } from "express";
import { Connection } from "typeorm";
import { ObjectType, Field } from "type-graphql";

/**
 * The Context type used by express-graphql. This is generated for each request
 * and passed through to any resolver method that's called along the way.
 */
export type Context = {
    req: Request;
    res: Response;
    conn: Connection;
};

@ObjectType()
export class EndpointResponse {
    @Field(() => [RespError])
    errors!: RespError[];
    @Field({ nullable: true })
    msg?: string;

    /**
     * Creates a response with an empty message and the given list of errors.
     * Not sure yet if it's cleaner to use this or just define the obj in-place
     * @param errors Any number of errors of shape RespError
     * @returns a response with the given list of errors set in the errors field
     */
    static withErrors(...errors: RespError[]): EndpointResponse {
        return {
            errors: errors,
        };
    }
}

@ObjectType()
export class RespError {
    @Field()
    kind!: string;
    @Field({ nullable: true })
    msg?: string;

    static fromError(kind: string, e: Error | any) {
        return {
            kind: kind,
            msg: e.message,
        };
    }
}
