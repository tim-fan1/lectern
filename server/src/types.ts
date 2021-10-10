import { Request, Response } from "express";
import { Connection } from "typeorm";
import { ObjectType, Field, ClassType } from "type-graphql";

/**
 * The Context type used by express-graphql. This is generated for each request
 * and passed through to any resolver method that's called along the way.
 */
export type Context = {
    req: Request;
    res: Response;
    conn: Connection;
};

/**
 * This is a basic response type that only includes the errors array. It should
 * be extended whenever there's some additional data to send. Decorators need
 * to be repeated; see https://typegraphql.com/docs/inheritance.html.
 */
@ObjectType()
export class EndpointResponse {
    @Field(() => [RespError])
    errors!: RespError[];

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

/**
 * Example subclass of EndpointResponse w/ string message.
 */
@ObjectType()
export class StringResponse extends EndpointResponse {
    @Field({ nullable: true })
    msg?: string;
}

/**
 * Error type for returned errors.
 */
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
