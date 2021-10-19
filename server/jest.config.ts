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
};
export default config;
