import { Request, Response } from "express";
import { Connection } from "typeorm";
import { ObjectType, Field } from "type-graphql";
import User from "./entities/User";
import LiveSession from "./utils/liveSession";

/**
 * The Context type used by express-graphql. This is generated for each request
 * and passed through to any resolver method that's called along the way.
 */
export interface Context {
    req: Request;
    res: Response;
    conn: Connection;
    openSessions: Map<number, LiveSession>;
}

/**
 * Ramble:
 * This AuthedContext interface is the context type in authorised methods,
 * where the additional fields are set by the auth mware. This is slightly
 * fudge-y as we're relying on the fact that tgql doesn't strict check the
 * ctx type - we're basically narrowing the context type as control passes
 * through the middleware.
 * There's nothing stopping us from declaring that the context type for an
 * endpoint which doesn't use the middleware is still AuthedContext; since
 * typechecking is static, but we narrow the type at runtime, tsc won't be
 * able to determine a typing violation, and at runtime the values will be
 * undefined when this shouldn't be allowed.
 *
 * Practical usage:
 * For resolver methods that use CheckAuth(), make the type of the ctx arg
 * AuthedContext instead; you'll be able to access these additional fields
 * in that method. Don't declare AuthedContext as the context type for non
 * decorated ones - no typechecker alarm bells will ring, but these values
 * may be undefined despite that being disallowed by the type.
 */
export interface AuthedContext extends Context {
    loginToken: string;
    user: User;
}

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

/**
 * A generic type that represents one of two underlying data types. This is
 * useful for functions that can fail; it lets us return additional error
 * information (like a RespError) in that case, and also lets us enforce
 * error checking using the type system.
 * Convention, left (first type arg) is for errors
 */
export type Either<T, U> =
    | { isLeft: true; data: T }
    | { isLeft: false; data: U };

export function left<T, U>(data: T): Either<T, U> {
    return { isLeft: true, data: data };
}

export function right<T, U>(data: U): Either<T, U> {
    return { isLeft: false, data: data };
}
