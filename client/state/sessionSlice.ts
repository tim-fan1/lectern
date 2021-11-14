import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session } from "../entities/entities";

interface SessionState {
    session?: Session;
}

const initialState: SessionState = {
    session: undefined,
};

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        updateSession: (state, newSess: PayloadAction<Session>) => {
            console.log(newSess.payload);
            state.session = newSess.payload;
        },
    },
});

export const { updateSession } = sessionSlice.actions;
export default sessionSlice.reducer;
