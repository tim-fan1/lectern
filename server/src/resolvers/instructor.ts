import {
    Arg,
    FieldResolver,
    Mutation,
    Query,
    Resolver,
    ResolverInterface,
    Root,
} from "type-graphql";
import { getConnection } from "typeorm";

import Instructor from "../entities/Instructor";

@Resolver((of) => Instructor)
export default class InstructorResolver
    implements ResolverInterface<Instructor>
{
    private hash(str: string): number {
        var hash = 0;
        if (str.length == 0) {
            return hash;
        }
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    @Query(() => Instructor, { nullable: true })
    async testInstructor(
        @Arg("name") name: string
    ): Promise<Instructor | undefined> {
        return {
            id: 0,
            name: name,
            hasPurposeInLife: this.hash(name) % 2 === 0,
        };
    }

    @FieldResolver()
    async name(@Root() root: Instructor): Promise<string> {
        return root.name;
    }

    @Mutation(() => Instructor)
    async addInstructor(@Arg("name") name: string): Promise<Instructor> {
        const connection = getConnection();
        const repository = connection.getRepository(Instructor);

        const newInstructor = repository.create({
            name: name,
            hasPurposeInLife: this.hash(name) % 2 === 0,
        });

        await repository.save(newInstructor);
        return newInstructor;
    }
}
