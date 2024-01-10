module.exports = {
  "setupFilesAfterEnv": [
    "<rootDir>/src/test/setupTests.ts"
  ],
  "roots": [
    "<rootDir>/src"
  ],
  "testEnvironment": "jsdom",
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(js|jsx|ts|tsx)$": "ts-jest"
  },
  "transformIgnorePatterns": [
    "/comments/ESM-only (https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) modules that should not be transformed by ts-jest",
    "/node_modules/(?!(mime)/)"
  ],
}
