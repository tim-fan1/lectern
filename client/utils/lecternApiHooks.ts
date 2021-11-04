import { CombinedError, useQuery, UseQueryArgs } from "urql";

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
        // TODO decode this.kind and provide a more use friendly error message
        return this.msg || this.kind;
    }
}

/// An abstraction over the useQuery hook to also parse and process api errors from the backend
/// LecternData: the model returned via the api. Generally via .data.[getSession].[sessions]
/// Variables: variables passed to the query
export const useLecternQuery = <LecternData extends object, Variables = object>(
    props: useLecternQueryProps<Variables>
): LecternApiResponse<LecternData> => {
    const [result] = useQuery<any, Variables>(props);
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
        // error happened on the top level
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
    const errors: ApiError[] = result.data![queryName].errors;
    if (errors.length !== 0) {
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
