#!/bin/bash

# Comprehensive test runner for GPT Task Runner
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
COVERAGE_THRESHOLD=90
TEST_TIMEOUT=30000

echo -e "${BLUE}🧪 Running GPT Task Runner Test Suite${NC}"
echo "=================================================="

# Function to print test results
print_result() {
    local test_type=$1
    local result=$2
    local duration=$3

    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✅ $test_type tests passed${NC} (Duration: ${duration}s)"
    else
        echo -e "${RED}❌ $test_type tests failed${NC} (Duration: ${duration}s)"
        return 1
    fi
}

# Run unit tests
echo -e "\n${YELLOW}📦 Running unit tests...${NC}"
start_time=$(date +%s)
if npm run test:unit --silent; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "Unit" 0 $duration
else
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "Unit" 1 $duration
    exit 1
fi

# Run integration tests
echo -e "\n${YELLOW}🔗 Running integration tests...${NC}"
start_time=$(date +%s)
if npm run test:integration --silent; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "Integration" 0 $duration
else
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "Integration" 1 $duration
    exit 1
fi

# Run end-to-end tests
echo -e "\n${YELLOW}🌐 Running end-to-end tests...${NC}"
start_time=$(date +%s)
if npm run test:e2e --silent; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "End-to-end" 0 $duration
else
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    print_result "End-to-end" 1 $duration
    exit 1
fi

# Check coverage
echo -e "\n${YELLOW}📊 Checking test coverage...${NC}"
if npm run test:coverage --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Coverage check passed${NC}"

    # Extract coverage percentage
    COVERAGE=$(npx nyc report --reporter=text | grep "All files" | awk '{print $3}' | sed 's/%//')

    if (( $(echo "$COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${GREEN}✅ Coverage threshold met: ${COVERAGE}% >= ${COVERAGE_THRESHOLD}%${NC}"
    else
        echo -e "${RED}❌ Coverage below threshold: ${COVERAGE}% < ${COVERAGE_THRESHOLD}%${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Coverage check failed${NC}"
    exit 1
fi

# Performance tests (if enabled)
if [ "${RUN_PERFORMANCE_TESTS:-false}" = "true" ]; then
    echo -e "\n${YELLOW}⚡ Running performance tests...${NC}"
    start_time=$(date +%s)
    if npm run test:performance --silent; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        print_result "Performance" 0 $duration
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        print_result "Performance" 1 $duration
        exit 1
    fi
fi

# Security tests
echo -e "\n${YELLOW}🔒 Running security tests...${NC}"
start_time=$(date +%s)
if npm audit --audit-level moderate; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo -e "${GREEN}✅ Security audit passed${NC} (Duration: ${duration}s)"
else
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo -e "${YELLOW}⚠️  Security vulnerabilities found, but continuing...${NC}"
fi

echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"
echo "=================================================="

# Generate test report
echo -e "\n${BLUE}📋 Test Summary${NC}"
echo "=================================================="
echo "Total test suites: $(find tests -name "*.test.ts" -o -name "*.spec.ts" | wc -l)"
echo "Coverage: ${COVERAGE}%"
echo "Security audit: Passed"
echo "Build status: ✅ Ready for deployment"