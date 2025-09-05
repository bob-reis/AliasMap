import { defineConfig } from 'vitest/config';

// Allow CI to generate coverage artifacts even when thresholds aren't met
const LOOSE_COVERAGE = process.env.VITEST_CI_COVERAGE === 'loose';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      all: true,
      provider: 'v8',
      reporter: ['lcov', 'text-summary', 'text', 'html'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/tests/**',
        '**/*.spec.*',
        '**/*.test.*'
      ],
      include: ['lib/**/*.ts'],
      thresholds: LOOSE_COVERAGE
        ? undefined
        : {
            global: {
              branches: 80,
              functions: 80,
              lines: 80,
              statements: 80
            }
          }
    },
    // Mock configuration for external dependencies
    setupFiles: ['./tests/setup.ts']
  }
});
