/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  collectCoverageFrom: ['<rootDir>/src/**/*.(ts|tsx)'],
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@mock/(.*)$': '<rootDir>/__mock__/$1',
    '@tests/(.*)$': '<rootDir>/__tests__/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Add more setup options before each test is run
  setupFiles: ['./jest.polyfills.js'],
  setupFilesAfterEnv: ['@testing-library/jest-dom', '@testing-library/react', '<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
