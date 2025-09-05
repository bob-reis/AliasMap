# Testing Architecture - The Architect's Design

This directory contains comprehensive test coverage for the AliasMap web application, designed to achieve >95% code coverage and satisfy SonarCloud Quality Gate requirements.

## <× Architecture Overview

The testing architecture follows Clean Code principles and TDD methodology, ensuring every module has comprehensive test coverage with proper mocking and edge case handling.

## =Á Test Structure

### Core Module Tests
- **`enhanced-engine.spec.ts`** - Tests for the main scanning engine with validation
- **`enhanced-engine-utils.spec.ts`** - Utility function tests for evidence building and pattern matching
- **`validation-engine.spec.ts`** - Comprehensive tests for the multi-validation system
- **`precision-metrics.spec.ts`** - Tests for quality metrics and performance tracking

### Supporting Module Tests
- **`fast.spec.ts`** - Fast scanning mode tests
- **`platforms.spec.ts`** - Platform detection and URL canonicalization tests
- **`type-check.spec.ts`** - Type validation and import verification tests
- **`types.spec.ts`** - TypeScript interface and type definition tests
- **`constants.spec.ts`** - Constants and disclaimer text validation tests

### Test Configuration
- **`setup.ts`** - Global test setup, mocks, and utilities
- **`smoke.spec.ts`** - Basic smoke tests for critical functionality

## <¯ Coverage Goals

### Current Requirements
- **Minimum Coverage**: 80% (SonarCloud Quality Gate)
- **Target Coverage**: 95% (The Architect's Excellence Standard)
- **Branch Coverage**: >90%
- **Function Coverage**: 100%

### Coverage Exclusions
- Configuration files (`*.config.ts`)
- Test files themselves (`*.spec.ts`, `*.test.ts`)
- Node modules and build artifacts
- Type definition files (`*.d.ts`)

## >ê Testing Strategy

### 1. Unit Testing
Each module has comprehensive unit tests covering:
-  Happy path scenarios
-  Error conditions and edge cases
-  Boundary value testing
-  Mock integration testing
-  Performance considerations

### 2. Integration Testing
Cross-module integration tests ensure:
-  ValidationEngine + PrecisionTracker integration
-  Enhanced engine with all sub-systems
-  Type safety across module boundaries
-  Real-world workflow scenarios

### 3. Security Testing
Security-focused tests validate:
-  Input sanitization
-  XSS prevention in evidence handling
-  Safe URL processing
-  Error message security
-  Timeout and rate limiting

## =' Running Tests

### Basic Test Commands
```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage

# Run complete quality checks
npm run quality
```

### Coverage Analysis
```bash
# Generate HTML coverage report
npm run coverage

# View coverage in browser (if available)
open coverage/index.html

# Check coverage with lcov tools
lcov --summary coverage/lcov.info
```

## =Ê Test Coverage Details

### ValidationEngine (`validation-engine.spec.ts`)
- **Total Tests**: 25+ comprehensive scenarios
- **Coverage**: Methods, error handling, validation strategies
- **Edge Cases**: Network failures, malformed data, timeout scenarios
- **Integration**: Multi-check validation, confidence scoring

### PrecisionTracker (`precision-metrics.spec.ts`)
- **Total Tests**: 20+ metric calculation scenarios
- **Coverage**: Metric calculation, site reliability, quality trends
- **Edge Cases**: Large datasets, missing data, boundary conditions
- **Integration**: Scan session tracking, quality reporting

### Enhanced Engine (`enhanced-engine.spec.ts`)
- **Total Tests**: 15+ workflow scenarios
- **Coverage**: Main scanning logic, async generators, error handling
- **Edge Cases**: Network timeouts, malformed responses, validation failures
- **Integration**: Full pipeline from scan to metrics

### Utility Functions (`enhanced-engine-utils.spec.ts`)
- **Total Tests**: 30+ utility function tests
- **Coverage**: Evidence building, pattern matching, URL processing
- **Edge Cases**: Invalid URLs, malformed HTML, encoding issues
- **Security**: XSS prevention, safe regex processing

## <­ Mock Strategy

### Global Mocks
- **`fetch`**: Comprehensive HTTP request mocking
- **`setTimeout/clearTimeout`**: Timer control for deterministic tests
- **`console`**: Suppressed output during tests
- **`Date.now`**: Time-based testing control

### Module-Specific Mocks
- **Network Responses**: Various HTTP status codes and content types
- **HTML Content**: Real-world HTML parsing scenarios
- **API Responses**: JSON API endpoint mocking
- **Error Conditions**: Network failures, timeouts, malformed data

## = SonarCloud Integration

### Quality Gate Requirements
- **Coverage**: e80% on new code
- **Maintainability**: A rating required
- **Reliability**: A rating required
- **Security**: A rating required
- **Duplicated Code**: <3%

### Reporting
- **LCOV Format**: `coverage/lcov.info`
- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage-summary.json`
- **Text Summary**: Console output during CI/CD

## =€ CI/CD Integration

### Automated Testing
Tests run automatically on:
- Every push to main/develop branches
- Pull request creation/updates
- Manual workflow dispatch
- Scheduled quality checks

### Quality Gates
- TypeScript compilation must pass
- ESLint rules must pass
- All tests must pass
- Coverage threshold must be met
- SonarCloud quality gate must pass

## =Ý Writing New Tests

### Test File Naming
- **Unit Tests**: `{module-name}.spec.ts`
- **Integration Tests**: `{feature-name}.integration.spec.ts`
- **Utility Tests**: `{module-name}-utils.spec.ts`

### Test Structure Template
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('methodName', () => {
    it('should handle happy path correctly', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error conditions gracefully', () => {
      // Test error scenarios
    });

    it('should validate edge cases', () => {
      // Test boundary conditions
    });
  });
});
```

### Best Practices
1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Clear, specific test descriptions
3. **Single Responsibility**: One concept per test
4. **Independent Tests**: No test dependencies
5. **Proper Mocking**: Mock external dependencies
6. **Edge Cases**: Test boundary conditions
7. **Error Handling**: Test failure scenarios
8. **Performance**: Consider timeout and memory usage

## =' Troubleshooting

### Common Issues
1. **Tests timing out**: Increase timeout in `vitest.config.ts`
2. **Mock not working**: Check mock setup in `setup.ts`
3. **Coverage gaps**: Use `npm run coverage` to identify uncovered lines
4. **Import errors**: Verify module paths and type definitions

### Debug Commands
```bash
# Run specific test file
npm run test validation-engine.spec.ts

# Run with verbose output
npm run test -- --reporter=verbose

# Run with UI (if available)
npm run test -- --ui

# Debug coverage issues
npm run coverage -- --reporter=lcov
```

## =È Continuous Improvement

### Metrics to Monitor
- **Coverage Percentage**: Should trend upward
- **Test Execution Time**: Should remain reasonable
- **Test Reliability**: No flaky tests
- **Code Quality**: Maintain SonarCloud A ratings

### Regular Maintenance
- Review and update mocks for API changes
- Add tests for new features immediately
- Refactor tests when code changes
- Monitor CI/CD performance and optimize

---

**The Architect's Testing Philosophy**: *"Every line of code is a responsibility. Every test is a promise. Every coverage report is a reflection of our commitment to quality."*

Generated by The Architect's Testing Framework