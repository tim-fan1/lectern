import { useLecternQuery, useLecternQueryProps } from "./lecternApiHooks";
import { SessionStateString } from "./util";
import { UseQueryArgs } from "urql";
import { Session } from "../entities/entities";

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
                group,
                activities {
                    id,
                    name,
                    state,
                    choices {
                        id,
                        name,
                    }
                }
            }
        }
    }
`;

// export interface Session {
//     code?: string;
//     id: number;
//     name: string;
//     state: SessionStateString;
//     startTime?: string;
//     endTime?: string;
//     group?: string;
// }

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
                id
                name
                author { name,pic,bio }
                group
                code
                state
                activities {
                    id,
                    name,
                    state,
                    kind
                    choices {
                        id,
                        name,
                    }
                },
                qna {
                    open,
                    questions {
                        id,
                        authorName,
                        question,
                        read,
                        created
                    }
                }
            }
            errors {
                kind
                msg
            }
        }
    }
`;

// export interface SessionWithAuthor extends Session {
//     author: {
//         name: string;
//         pic: string;
//         bio: string;
//     };
// }
export const useSessionDetailsQuery = (
    props?: UseLecternSpecificProps & {
        variables: {
            code: string;
        };
    }
) => {
    return useLecternQuery<Session>({
        ...props,
        queryName: "sessionDetails",
        queryField: "session",
        query: QuerySessionDetails,
    });
};
