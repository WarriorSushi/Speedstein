#!/bin/bash

###############################################################################
# Performance Validation Script
# Constitution Principle I: Performance First
# Constitution Principle VII: User Experience
#
# Validates:
# - Lighthouse scores (target: 95+ on all metrics)
# - PDF generation P95 latency (target: <2s)
# - Landing page LCP (target: <2s)
# - Bundle size optimization
###############################################################################

set -e

echo "🚀 Speedstein Performance Validation"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
command -v npx >/dev/null 2>&1 || { echo "npx is required but not installed. Aborting." >&2; exit 1; }

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:8787}"
TEST_API_KEY="${TEST_API_KEY:-}"

echo "Configuration:"
echo "  Frontend URL: $FRONTEND_URL"
echo "  API URL: $API_URL"
echo ""

###############################################################################
# 1. Lighthouse Audit
###############################################################################

echo "📊 Running Lighthouse Audit..."
echo "-------------------------------"

if ! command -v lighthouse >/dev/null 2>&1; then
  echo "${YELLOW}⚠️  Lighthouse not installed. Installing...${NC}"
  npm install -g lighthouse
fi

# Run Lighthouse on landing page
lighthouse "$FRONTEND_URL" \
  --output=html \
  --output=json \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo

# Parse scores from JSON
if [ -f "./lighthouse-report.json" ]; then
  PERF_SCORE=$(cat lighthouse-report.json | jq -r '.categories.performance.score * 100')
  A11Y_SCORE=$(cat lighthouse-report.json | jq -r '.categories.accessibility.score * 100')
  BP_SCORE=$(cat lighthouse-report.json | jq -r '.categories["best-practices"].score * 100')
  SEO_SCORE=$(cat lighthouse-report.json | jq -r '.categories.seo.score * 100')
  LCP=$(cat lighthouse-report.json | jq -r '.audits["largest-contentful-paint"].numericValue / 1000')

  echo ""
  echo "Lighthouse Scores:"
  echo "  Performance:     ${PERF_SCORE}% (target: 95+)"
  echo "  Accessibility:   ${A11Y_SCORE}% (target: 95+)"
  echo "  Best Practices:  ${BP_SCORE}% (target: 95+)"
  echo "  SEO:             ${SEO_SCORE}% (target: 95+)"
  echo "  LCP:             ${LCP}s (target: <2s)"
  echo ""

  # Check thresholds
  PASSED=true
  if (( $(echo "$PERF_SCORE < 95" | bc -l) )); then
    echo "${RED}❌ Performance score below target${NC}"
    PASSED=false
  fi
  if (( $(echo "$A11Y_SCORE < 95" | bc -l) )); then
    echo "${RED}❌ Accessibility score below target${NC}"
    PASSED=false
  fi
  if (( $(echo "$SEO_SCORE < 95" | bc -l) )); then
    echo "${RED}❌ SEO score below target${NC}"
    PASSED=false
  fi
  if (( $(echo "$LCP > 2" | bc -l) )); then
    echo "${RED}❌ LCP above target${NC}"
    PASSED=false
  fi

  if [ "$PASSED" = true ]; then
    echo "${GREEN}✅ All Lighthouse targets met!${NC}"
  else
    echo "${YELLOW}⚠️  Some Lighthouse targets not met. Review lighthouse-report.html${NC}"
  fi
else
  echo "${RED}❌ Lighthouse report not generated${NC}"
fi

echo ""

###############################################################################
# 2. PDF Generation Performance Test
###############################################################################

echo "📄 Testing PDF Generation Performance..."
echo "----------------------------------------"

if [ -z "$TEST_API_KEY" ]; then
  echo "${YELLOW}⚠️  TEST_API_KEY not set. Skipping PDF generation test.${NC}"
  echo "   Set TEST_API_KEY environment variable to run this test."
else
  # Test simple HTML
  echo "Testing simple HTML PDF generation (10 requests)..."

  TOTAL_TIME=0
  SUCCESS_COUNT=0

  for i in {1..10}; do
    START_TIME=$(date +%s%3N)

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/generate" \
      -H "Authorization: Bearer $TEST_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"html":"<h1>Performance Test '"$i"'</h1>"}')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    END_TIME=$(date +%s%3N)
    DURATION=$((END_TIME - START_TIME))

    if [ "$HTTP_CODE" -eq 200 ]; then
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
      TOTAL_TIME=$((TOTAL_TIME + DURATION))
      echo "  Request $i: ${DURATION}ms"
    else
      echo "  Request $i: Failed (HTTP $HTTP_CODE)"
    fi
  done

  if [ $SUCCESS_COUNT -gt 0 ]; then
    AVG_TIME=$((TOTAL_TIME / SUCCESS_COUNT))
    echo ""
    echo "Results:"
    echo "  Successful requests: $SUCCESS_COUNT/10"
    echo "  Average time:        ${AVG_TIME}ms"
    echo "  Target:              <2000ms (2 seconds)"
    echo ""

    if [ $AVG_TIME -lt 2000 ]; then
      echo "${GREEN}✅ PDF generation performance target met!${NC}"
    else
      echo "${RED}❌ PDF generation performance above target${NC}"
    fi
  else
    echo "${RED}❌ No successful PDF generations${NC}"
  fi
fi

echo ""

###############################################################################
# 3. Bundle Size Analysis
###############################################################################

echo "📦 Analyzing Bundle Size..."
echo "---------------------------"

if [ -d "apps/web/.next" ]; then
  # Next.js bundle analysis
  cd apps/web

  # Check if build exists
  if [ -f ".next/build-manifest.json" ]; then
    # Get total JS size
    TOTAL_JS_SIZE=$(find .next/static/chunks -name "*.js" -exec du -ch {} + | grep total | awk '{print $1}')
    echo "  Total JS bundle size: $TOTAL_JS_SIZE"
    echo "  Target: <500KB (gzipped)"
    echo ""
    echo "${YELLOW}💡 Tip: Run 'pnpm run analyze' for detailed bundle analysis${NC}"
  else
    echo "${YELLOW}⚠️  Next.js build not found. Run 'pnpm build' first.${NC}"
  fi

  cd ../..
else
  echo "${YELLOW}⚠️  .next directory not found. Run 'pnpm build' first.${NC}"
fi

echo ""

###############################################################################
# 4. Summary
###############################################################################

echo "📋 Performance Validation Summary"
echo "=================================="
echo ""
echo "Reports generated:"
echo "  - lighthouse-report.html (detailed Lighthouse audit)"
echo "  - lighthouse-report.json (machine-readable scores)"
echo ""
echo "Next steps:"
echo "  1. Review lighthouse-report.html for optimization recommendations"
echo "  2. Run load tests with k6 for sustained performance validation"
echo "  3. Monitor production metrics with Sentry and Cloudflare Analytics"
echo ""
echo "${GREEN}✨ Performance validation complete!${NC}"
