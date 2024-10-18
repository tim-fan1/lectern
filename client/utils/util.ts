export enum SessionActivity {
    POLL = "POLL",
    QA = "QA",
    QUIZ = "QUIZ",
    DND = "DND",
}

export namespace SessionActivity {
    export function toString(sa: SessionActivity): string {
        return SessionActivity[sa];
    }
}

export type SessionStateString = "draft" | "open" | "archived";
export enum SessionState {
    DRAFT,
    OPEN,
    ARCHIVED,
}

export function sessionStateFromString(str: SessionStateString): SessionState {
    switch (str) {
        case "draft":
            return SessionState.DRAFT;
        case "open":
            return SessionState.OPEN;
        case "archived":
            return SessionState.ARCHIVED;
    }
}

export type ActivityStateString = "draft" | "open" | "archived";
export enum ActivityState {
    DRAFT,
    OPEN,
    ARCHIVED,
}

export function activityStateFromString(str: ActivityStateString): ActivityState {
    switch (str) {
        case "draft":
            return ActivityState.DRAFT;
        case "open":
            return ActivityState.OPEN;
        case "archived":
            return ActivityState.ARCHIVED;
    }
}

export function sessionDateToString(date: Date): string {
    /* E.g: 16:30 29th Sept */
    let timeDateString = "";

    timeDateString += " " + padWithZeroByOne(date.getHours());
    timeDateString += ":" + padWithZeroByOne(date.getMinutes());
    timeDateString += " " + padWithZeroByOne(date.getDate());
    timeDateString += " " + indexToMonth(date.getMonth());

    return timeDateString;
}

function padWithZeroByOne(num: number): string {
    let numString = num.toString();
    if (num < 10) numString = "0" + numString;

    return numString;
}

export function indexToMonth(index: number): string {
    console.assert(index >= 0 && index <= 11);

    switch (index) {
        case 0:
            return "Jan";
        case 1:
            return "Feb";
        case 2:
            return "Mar";
        case 3:
            return "Apr";
        case 4:
            return "May";
        case 5:
            return "June";
        case 6:
            return "July";
        case 7:
            return "Aug";
        case 8:
            return "Sept";
        case 9:
            return "Oct";
        case 10:
            return "Nov";
        case 11:
            return "Dec";
    }

    return "";
}

export function validateSessionCode(code?: string): boolean {
    return code !== undefined && code.length === 6;
}
