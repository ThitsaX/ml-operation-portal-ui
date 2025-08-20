module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
  '^@services/(.*)$': '<rootDir>/src/services/$1',
  '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@helpers$': '<rootDir>/src/helpers/index.ts',      // <-- Add this for main index
  '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',       // <-- Add this for submodules
  '^@store$': '<rootDir>/src/store/index.ts',
  '^@store/(.*)$': '<rootDir>/src/store/$1',
  '^@typescript/(.*)$': '<rootDir>/src/typescript/$1',
  '^@configs$': '<rootDir>/src/configs/index.ts',
  '^@configs/(.*)$': '<rootDir>/src/configs/$1',
  '^@locales$': '<rootDir>/src/locales/index.ts',
  '^@locales/(.*)$': '<rootDir>/src/locales/$1',
  '^@utils$': '<rootDir>/src/utils/index.ts',
  '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  // Add other aliases as needed
},
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lodash-es)'
  ],
};