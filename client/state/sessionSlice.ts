import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session, Activity, QnA } from "../entities/entities";
import { RootState } from "./store";
import { SessionState as SessionActiveState } from "../entities/Session";

interface SessionState {
    session?: Session;
    name?: string;
}

const initialState: SessionState = {
    session: undefined,
    name: undefined,
};

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        updateSession: (state, newSess: PayloadAction<Session>) => {
            state.session = newSess.payload;
        },
        updateSessionState: (state, newSessionState: PayloadAction<SessionActiveState>) => {
            /* Something has gone wrong if we try to update state without having a session already in the store. */
            console.assert(state.session !== undefined);
            state.session!.state = newSessionState.payload;
        },
        updateSessionActivities: (state, newActivities: PayloadAction<Activity[]>) => {
            /* Something has gone wrong if we try to update state without having a session already in the store. */
            console.assert(state.session !== undefined);
            state.session!.activities = newActivities.payload;
        },
        updateSessionQna: (state, newQna: PayloadAction<QnA>) => {
            state.session!.qna = newQna.payload;
        },
        updateName: (state, newName: PayloadAction<string>) => {
            state.name = newName.payload.trim();
        },
    },
});

export const {
    updateSession,
    updateSessionState,
    updateSessionActivities,
    updateSessionQna,
    updateName,
} = sessionSlice.actions;

export const selectSession = (state: RootState) => state.session.session;

export default sessionSlice.reducer;
