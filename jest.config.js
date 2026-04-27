module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', 'test/fixtures/*.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(?:@actions/core|@actions/github)/)'],
  moduleNameMapper: {
    '^@actions/core$': '<rootDir>/test/__mocks__/@actions/core.ts',
    '^@actions/github$': '<rootDir>/test/__mocks__/@actions/github.ts',
    '^@actions/github/(.*)$': '<rootDir>/test/__mocks__/@actions/github.ts'
  },
  verbose: true
}