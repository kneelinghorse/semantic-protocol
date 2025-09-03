module.exports = {
  projects: [
    {
      displayName: 'core',
      testMatch: ['<rootDir>/unit/core/**/*.test.js'],
      coverageDirectory: '<rootDir>/coverage/core',
      collectCoverageFrom: [
        'packages/core/src/**/*.js',
        '!**/*.d.ts',
        '!**/node_modules/**'
      ]
    },
    {
      displayName: 'react',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/unit/react/**/*.test.{js,tsx}'],
      coverageDirectory: '<rootDir>/coverage/react',
      collectCoverageFrom: [
        'packages/react/src/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**'
      ],
      setupFilesAfterEnv: ['<rootDir>/utils/setup-react.js']
    },
    {
      displayName: 'vue',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/unit/vue/**/*.test.{js,ts}'],
      coverageDirectory: '<rootDir>/coverage/vue',
      collectCoverageFrom: [
        'packages/vue/src/**/*.{ts,vue}',
        '!**/*.d.ts',
        '!**/node_modules/**'
      ],
      transform: {
        '^.+\\.vue$': '@vue/vue3-jest',
        '^.+\\.tsx?$': 'ts-jest'
      }
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/integration/**/*.test.js'],
      testEnvironment: 'jsdom',
      coverageDirectory: '<rootDir>/coverage/integration'
    }
  ],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  },
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000
};