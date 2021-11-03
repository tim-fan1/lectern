import { CombinedError, useQuery } from "urql";
import { UseQueryArgs, UseQueryResponse } from "urql/dist/types/hooks/useQuery";

interface LecternApiResponseOk<Data> {
    data: Data;
    errors: null;
    fetching: false;
}

interface LecternApiResponseError {
    errors: (CombinedError | ConcreteApiError)[];
    data: null;
    fetching: false;
}

interface LecternApiResponseFetching {
    errors: null;
    data: null;
    fetching: true;
}

type LecternApiResponse<Data> =
    | LecternApiResponseOk<Data>
    | LecternApiResponseError
    | LecternApiResponseFetching;

interface QueryProps<Variables, Data> extends UseQueryArgs<Variables, Data> {
    queryName: string;
    queryField: string;
}

interface ApiError {
    kind: string;
    msg: string;
}

class ConcreteApiError implements ApiError {
    kind: string;
    msg: string;

    constructor(kind: string, msg: string) {
        this.kind = kind;
        this.msg = msg;
    }

    toString() {
        // try msg, otherwise fall back to kind if empty string.
        // TODO decode this.kind and provide a more use friendly error message
        return this.msg || this.kind;
    }
}

/// An abstraction over the useQuery hook to also parse and process api errors from the backend
/// LecternData: the model returned via the api. Generally via .data.[getSession].[sessions]
/// Variables: variables passed to the query
export const useLecternQuery = <LecternData extends object, Variables = object>({
    query,
    queryName,
    queryField,
    variables,
}: QueryProps<Variables, any>): LecternApiResponse<LecternData> => {
    const [result] = useQuery<any, Variables>({ query: query, variables: variables });
    if (result.fetching) {
        return {
            fetching: true,
            errors: null,
            data: null,
        };
    }
    if (result.error !== undefined) {
        // error happened on the top level
        return {
            fetching: false,
            errors: [result.error],
            data: null,
        };
    }
    const errors: ApiError[] = result.data![queryName].errors;
    if (errors.length !== 0) {
        return {
            fetching: false,
            data: null,
            errors: errors.map((e) => new ConcreteApiError(e.kind, e.msg)),
        };
    }

    // no errors, data must be populated
    const data: LecternData = result.data![queryName][queryField];

    return {
        fetching: false,
        errors: null,
        data: data,
    };
};
