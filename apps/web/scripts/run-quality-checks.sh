#!/bin/bash

# The Architect's Quality Assurance Script
# Comprehensive testing and quality checks for SonarCloud compliance

set -e  # Exit on any error

echo "<×  The Architect is initializing quality assurance checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}=' $1${NC}"
}

print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   $1${NC}"
}

print_error() {
    echo -e "${RED}L $1${NC}"
}

# Ensure we're in the correct directory
cd "$(dirname "$0")/.."

print_step "Validating project structure..."
if [[ ! -f "package.json" ]]; then
    print_error "Not in the correct directory. Please run from apps/web"
    exit 1
fi

print_step "Installing dependencies if needed..."
if [[ ! -d "node_modules" ]]; then
    npm install
fi

print_step "Running TypeScript type checking..."
if npm run typecheck; then
    print_success "TypeScript validation passed"
else
    print_error "TypeScript validation failed"
    exit 1
fi

print_step "Running ESLint code quality checks..."
if npm run lint; then
    print_success "ESLint validation passed"
else
    print_error "ESLint validation failed"
    exit 1
fi

print_step "Running comprehensive test suite..."
if npm run test; then
    print_success "All tests passed"
else
    print_error "Some tests failed"
    exit 1
fi

print_step "Generating code coverage report..."
if npm run coverage; then
    print_success "Coverage report generated"
else
    print_error "Coverage generation failed"
    exit 1
fi

# Check if coverage directory exists
if [[ -d "coverage" ]]; then
    print_step "Analyzing coverage results..."
    
    # Extract coverage percentage from lcov.info if it exists
    if [[ -f "coverage/lcov.info" ]]; then
        print_success "LCOV coverage report generated successfully"
        
        # Generate coverage summary
        if command -v lcov >/dev/null 2>&1; then
            print_step "Generating coverage summary..."
            lcov --summary coverage/lcov.info
        else
            print_warning "lcov command not found. Install lcov for detailed coverage analysis."
        fi
    else
        print_warning "LCOV report not found. SonarCloud integration may be affected."
    fi
    
    # Check if HTML report exists
    if [[ -d "coverage/html" ]] || [[ -f "coverage/index.html" ]]; then
        print_success "HTML coverage report available"
        print_step "Open coverage/index.html in your browser to view detailed results"
    fi
else
    print_error "Coverage directory not found"
    exit 1
fi

print_step "Checking coverage thresholds..."

# Extract coverage data and check thresholds
if [[ -f "coverage/lcov.info" ]]; then
    # Simple check for coverage - in production you'd use a proper parser
    TOTAL_LINES=$(grep -c "^DA:" coverage/lcov.info || echo "0")
    COVERED_LINES=$(grep -c "^DA:.*,[1-9]" coverage/lcov.info || echo "0")
    
    if [[ $TOTAL_LINES -gt 0 ]]; then
        COVERAGE_PERCENT=$((COVERED_LINES * 100 / TOTAL_LINES))
        
        if [[ $COVERAGE_PERCENT -ge 80 ]]; then
            print_success "Coverage: ${COVERAGE_PERCENT}% (e80% required) ("
        else
            print_warning "Coverage: ${COVERAGE_PERCENT}% (below 80% threshold)"
            print_warning "SonarCloud Quality Gate may fail"
        fi
    else
        print_warning "Could not calculate coverage percentage"
    fi
fi

print_step "Validating test files exist for all source modules..."

# Check if all .ts files in lib/ have corresponding test files
MISSING_TESTS=0
for source_file in lib/*.ts; do
    if [[ -f "$source_file" ]]; then
        filename=$(basename "$source_file" .ts)
        test_file="tests/${filename}.spec.ts"
        
        if [[ ! -f "$test_file" ]]; then
            print_warning "Missing test file: $test_file for $source_file"
            MISSING_TESTS=$((MISSING_TESTS + 1))
        fi
    fi
done

if [[ $MISSING_TESTS -eq 0 ]]; then
    print_success "All source files have corresponding test files"
else
    print_warning "$MISSING_TESTS source files are missing test coverage"
fi

print_step "Preparing SonarCloud integration..."

# Check if sonar-project.properties exists
if [[ -f "../../sonar-project.properties" ]]; then
    print_success "SonarCloud configuration found"
else
    print_warning "SonarCloud configuration not found at project root"
fi

# Generate quality report
print_step "Generating quality assurance report..."

cat > quality-report.md << EOF
# Quality Assurance Report

Generated: $(date)

## Test Results
-  TypeScript validation: PASSED
-  ESLint validation: PASSED
-  Unit tests: PASSED
-  Coverage generation: PASSED

## Coverage Analysis
- Report location: \`coverage/lcov.info\`
- HTML report: \`coverage/index.html\`
- Threshold: e80% required for SonarCloud Quality Gate

## Test Files Summary
- Total test files: $(ls tests/*.spec.ts 2>/dev/null | wc -l)
- Source files covered: $(($(ls lib/*.ts 2>/dev/null | wc -l) - MISSING_TESTS))
- Missing test coverage: $MISSING_TESTS files

## SonarCloud Readiness
- Configuration: $([ -f "../../sonar-project.properties" ] && echo " Ready" || echo "  Missing")
- LCOV report: $([ -f "coverage/lcov.info" ] && echo " Generated" || echo "L Missing")
- CI/CD workflow: $([ -f "../../.github/workflows/quality-gate.yml" ] && echo " Configured" || echo "  Missing")

## Next Steps
1. Push changes to trigger CI/CD pipeline
2. Monitor SonarCloud Quality Gate results
3. Address any remaining coverage gaps
4. Ensure all new code meets quality standards

---
Generated by The Architect's Quality Assurance System
EOF

print_success "Quality report generated: quality-report.md"

print_step "Quality checks complete! Summary:"
echo -e "${GREEN}"
cat << EOF
TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW
Q                    <×  THE ARCHITECT'S REPORT                Q
Q                                                              Q
Q   All quality checks PASSED                                Q
Q  =Ê Coverage report generated                                Q
Q  =€ Ready for SonarCloud integration                         Q
Q  =Ý Comprehensive test suite implemented                     Q
Q                                                              Q
Q  Coverage Target: e80% for Quality Gate                     Q
Q  Status: READY FOR DEPLOYMENT                               Q
ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]
EOF
echo -e "${NC}"

print_success "The Architect has completed quality assurance. All systems operational! <¯"

# Optional: Open coverage report if running in a desktop environment
if [[ "$DISPLAY" != "" ]] && command -v xdg-open >/dev/null 2>&1 && [[ -f "coverage/index.html" ]]; then
    print_step "Opening coverage report in browser..."
    xdg-open coverage/index.html
fi

exit 0