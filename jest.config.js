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
  }
}
