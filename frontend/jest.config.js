// Bridge Jest with Next.js so we reuse Next's config (TS, module aliases, etc.).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** Base Jest config for the app; `createJestConfig` will merge in Next-specific options. */
const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)"],
};

module.exports = createJestConfig(customJestConfig);

