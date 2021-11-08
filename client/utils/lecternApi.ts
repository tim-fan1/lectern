import { useLecternQuery, useLecternQueryProps } from "./lecternApiHooks";
import { SessionStateString } from "./util";
import { UseQueryArgs } from "urql";

const QueryGetSessions = `
    query {
        getSessions {
            errors {
                kind,
                msg
            }
            sessions {
                code,
                id,
                name,
                state,
                startTime,
                endTime,
                group
            }
        }
    }
`;

export interface Session {
    code?: string;
    id: number;
    name: string;
    state: SessionStateString;
    startTime?: string;
    endTime?: string;
    group?: string;
}

// just in case we
export type UseLecternSpecificProps = {
    pause?: boolean;
};

export const useGetSessionsQuery = (props?: UseLecternSpecificProps) => {
    return useLecternQuery<Session[]>({
        ...props,
        queryName: "getSessions",
        queryField: "sessions",
        query: QueryGetSessions,
    });
};

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session {
                name
                author { name,pic,bio }
                group
                code
            }
            errors {
                kind
                msg
            }
        }
    }
`;

export interface SessionWithAuthor extends Session {
    author: {
        name: string;
        pic: string;
        bio: string;
    };
}
export const useSessionDetailsQuery = (
    props?: UseLecternSpecificProps & {
        variables: {
            code: string;
        };
    }
) => {
    return useLecternQuery<SessionWithAuthor>({
        ...props,
        queryName: "sessionDetails",
        queryField: "session",
        query: QuerySessionDetails,
    });
};
