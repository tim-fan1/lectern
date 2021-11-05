import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    verbose: true,
    preset: "ts-jest",
    testEnvironment: "node",
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    roots: ["<rootDir>/src"],
    collectCoverage: true,
    setupFilesAfterEnv: ["jest-extended/all"],
};
export default config;
