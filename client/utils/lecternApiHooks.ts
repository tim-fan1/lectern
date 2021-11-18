import { CombinedError, OperationResult, useMutation, useQuery, UseQueryArgs } from "urql";

/// Interface to get data. Note that the object returned is always
/// a concrete object; it will throw an error otherwise
/// use data to get a nullable version of the data
interface GetData<Data extends Object> {
    getData: () => Data;
}

interface LecternApiResponseOk<Data extends Object> extends GetData<Data> {
    fetching: false;
    errors: [];
    data: Data;
}

interface LecternApiResponseError<Data extends Object> extends GetData<Data> {
    fetching: false;
    errors: (CombinedError | ConcreteApiError)[];
    data: null;
}

// either we are paused or in the middle of fetching a request
interface LecternApiResponseFetching<Data extends Object> extends GetData<Data> {
    fetching: true;
    errors: [];
    data: null;
}

type LecternApiResponse<Data extends Object> =
    | LecternApiResponseOk<Data>
    | LecternApiResponseError<Data>
    | LecternApiResponseFetching<Data>;

export interface useLecternQueryProps<Variables = object, Data = any>
    extends UseQueryArgs<Variables, Data> {
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
        return this.msg || this.kind;
    }
}

/// An abstraction over the useQuery hook to also parse and process api errors from the backend
/// LecternData: the model returned via the api. Generally via .data.[getSession].[sessions]
/// Variables: variables passed to the query
export const useLecternQuery = <LecternData extends object, Variables = any>(
    props: useLecternQueryProps<Variables>
): LecternApiResponse<LecternData> => {
    const [result] = useQuery<any, Variables>(props);

    return lecternCheckForError<LecternData>(result, props);
};

export type checkForType = {
    queryName: string;
    queryField: string;
};

export const lecternCheckForError = <LecternData extends object, Variables = any>(
    result: any,
    props: checkForType
): LecternApiResponse<LecternData> => {
    if (result.fetching) {
        return {
            fetching: true,
            errors: [],
            data: null,
            getData: () => {
                throw new Error("cannot retrieve data while fetching");
            },
        };
    }
    if (result.error !== undefined) {
        // network error (mostly from fetch / Network related)
        return {
            fetching: false,
            errors: [result.error],
            data: null,
            getData: () => {
                throw new Error("cannot retrieve data while error");
            },
        };
    }
    const { queryName, queryField } = props;
    if (result.data === undefined) {
        // result.fetching, error and data are all undefined or false
        // this means we are "paused"
        return {
            // HACK: return fetching = true to indicate to consumer that
            // no data has been given to us yet, but no error has occured
            fetching: true,
            data: null,
            errors: [],
            getData: () => {
                throw new Error("cannot retrieve data while fetching");
            },
        };
    } else if (result.data!.errors !== undefined) {
        // backend 500 errors. These are sus and because the backend raised
        // an exception that wasn't handled
        interface TypeGraphqlError {
            message: string;
            locations: { line: string; column: string }[];
        }
        return {
            fetching: false,
            data: null,
            errors: result.data!.errors.map(
                (e: TypeGraphqlError) => new ConcreteApiError("", e.message)
            ),
            getData: () => {
                throw new Error("cannot retreive data while error");
            },
        };
    }
    const errors: ApiError[] = result.data![queryName].errors;
    if (errors.length !== 0) {
        // errors signaled at the query level
        return {
            fetching: false,
            data: null,
            errors: errors.map((e) => new ConcreteApiError(e.kind, e.msg)),
            getData: () => {
                throw new Error("cannot retrieve data while error");
            },
        };
    }

    // no errors, data must be populated
    const data: LecternData = result.data![queryName][queryField];

    return {
        fetching: false,
        errors: [],
        data: data,
        getData: () => {
            return data;
        },
    };
};
