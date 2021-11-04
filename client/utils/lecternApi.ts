import { useLecternQuery, useLecternQueryProps } from "./lecternApiHooks";
import { SessionStateString } from "../util";

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

export type Session = {
    code?: string;
    id: number;
    name: string;
    state: SessionStateString;
    startTime?: string;
    endTime?: string;
    group?: string;
};

export const useGetSessionsQuery = (props?: useLecternQueryProps) => {
    return useLecternQuery<Session[]>({
        ...props,
        queryName: "getSessions",
        queryField: "sessions",
        query: QueryGetSessions,
    });
};
