module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/android/', '/ios/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
