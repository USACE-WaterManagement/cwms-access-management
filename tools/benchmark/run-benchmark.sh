#!/bin/bash

# CWMS Authorization Proxy Benchmark Runner
# This script runs k6 load tests and generates a performance report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/docs/benchmarks"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/benchmark-report-${TIMESTAMP}.md"

# Configuration
PROXY_URL="${PROXY_URL:-http://localhost:3001}"
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
K6_OUTPUT_FILE="/tmp/k6-results-${TIMESTAMP}.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get system information
get_system_info() {
    local cpu_info=""
    local memory_info=""
    local os_info=""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        cpu_info=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Unknown")
        memory_info=$(( $(sysctl -n hw.memsize 2>/dev/null || echo "0") / 1024 / 1024 / 1024 ))GB
        os_info=$(sw_vers -productName 2>/dev/null || echo "macOS") $(sw_vers -productVersion 2>/dev/null || echo "")
    else
        cpu_info=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs || echo "Unknown")
        memory_info=$(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Unknown")
        os_info=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"' || echo "Unknown")
    fi

    echo "cpu_info=$cpu_info"
    echo "memory_info=$memory_info"
    echo "os_info=$os_info"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Install it with: brew install k6"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi

    # Check if proxy is running
    if ! curl -s "${PROXY_URL}/health" > /dev/null 2>&1; then
        log_error "Authorization proxy is not accessible at ${PROXY_URL}"
        log_error "Make sure the services are running: podman compose up -d"
        exit 1
    fi

    # Check if Keycloak is running
    if ! curl -s "${KEYCLOAK_URL}/auth/realms/cwms" > /dev/null 2>&1; then
        log_warn "Keycloak might not be accessible at ${KEYCLOAK_URL}"
        log_warn "Some authenticated tests may fail"
    fi

    log_info "Prerequisites check passed"
}

# Fetch metrics before benchmark
fetch_pre_metrics() {
    log_info "Fetching pre-benchmark metrics..."
    curl -s "${PROXY_URL}/metrics" > /tmp/pre-metrics.txt 2>/dev/null || true
}

# Fetch metrics after benchmark
fetch_post_metrics() {
    log_info "Fetching post-benchmark metrics..."
    curl -s "${PROXY_URL}/metrics" > /tmp/post-metrics.txt 2>/dev/null || true
    curl -s "${PROXY_URL}/metrics/json" > /tmp/post-metrics.json 2>/dev/null || true
}

# Parse Prometheus metrics
parse_metric() {
    local metric_name=$1
    local file=$2
    grep "^${metric_name}" "$file" 2>/dev/null | head -1 | awk '{print $2}' || echo "N/A"
}

# Run k6 benchmark
run_benchmark() {
    log_info "Starting k6 benchmark..."

    mkdir -p "$OUTPUT_DIR"

    k6 run \
        --out json="${K6_OUTPUT_FILE}" \
        -e PROXY_URL="${PROXY_URL}" \
        -e KEYCLOAK_URL="${KEYCLOAK_URL}" \
        "$SCRIPT_DIR/scenarios.js" 2>&1 | tee /tmp/k6-output.txt

    log_info "Benchmark completed"
}

# Generate markdown report
generate_report() {
    log_info "Generating benchmark report..."

    # Get system info
    eval "$(get_system_info)"

    # Parse k6 results
    local total_requests=$(grep -o '"metric":"http_reqs"' "${K6_OUTPUT_FILE}" 2>/dev/null | wc -l | xargs || echo "0")
    local avg_duration=$(grep '"metric":"http_req_duration"' "${K6_OUTPUT_FILE}" 2>/dev/null | head -100 | jq -s 'map(.data.value) | add / length' 2>/dev/null || echo "N/A")

    # Get metrics from Prometheus endpoint
    local cache_hits=$(parse_metric "authorizer_proxy_cache_hits_total" /tmp/post-metrics.txt)
    local cache_misses=$(parse_metric "authorizer_proxy_cache_misses_total" /tmp/post-metrics.txt)
    local opa_cache_hits=$(parse_metric "authorizer_proxy_opa_cache_hits_total" /tmp/post-metrics.txt)
    local opa_cache_misses=$(parse_metric "authorizer_proxy_opa_cache_misses_total" /tmp/post-metrics.txt)

    # Calculate cache hit rate
    local user_cache_rate="N/A"
    if [[ "$cache_hits" != "N/A" && "$cache_misses" != "N/A" ]]; then
        local total_cache=$((cache_hits + cache_misses))
        if [[ $total_cache -gt 0 ]]; then
            user_cache_rate=$(echo "scale=2; $cache_hits * 100 / $total_cache" | bc 2>/dev/null || echo "N/A")
        fi
    fi

    local opa_cache_rate="N/A"
    if [[ "$opa_cache_hits" != "N/A" && "$opa_cache_misses" != "N/A" ]]; then
        local total_opa=$((opa_cache_hits + opa_cache_misses))
        if [[ $total_opa -gt 0 ]]; then
            opa_cache_rate=$(echo "scale=2; $opa_cache_hits * 100 / $total_opa" | bc 2>/dev/null || echo "N/A")
        fi
    fi

    # Extract k6 summary stats from output
    local p95_duration=$(grep "http_req_duration" /tmp/k6-output.txt 2>/dev/null | grep "p(95)" | grep -oE "[0-9]+\.[0-9]+ms" | head -1 || echo "N/A")
    local p99_duration=$(grep "http_req_duration" /tmp/k6-output.txt 2>/dev/null | grep "p(99)" | grep -oE "[0-9]+\.[0-9]+ms" | head -1 || echo "N/A")
    local requests_per_sec=$(grep "http_reqs" /tmp/k6-output.txt 2>/dev/null | grep -oE "[0-9]+\.[0-9]+/s" | head -1 || echo "N/A")

    cat > "$REPORT_FILE" << EOF
# CWMS Authorization Proxy - Performance Benchmark Report

**Generated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Disclaimer

This benchmark was conducted on a local development machine. Results may vary significantly in production environments with different hardware, network conditions, and load patterns.

## Test Environment

| Component | Details |
|-----------|---------|
| **Machine** | ${cpu_info} |
| **Memory** | ${memory_info} |
| **OS** | ${os_info} |
| **Container Runtime** | Podman $(podman --version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" || echo "N/A") |
| **Node.js** | $(node --version 2>/dev/null || echo "N/A") |
| **k6 Version** | $(k6 version 2>/dev/null | head -1 || echo "N/A") |

## Test Configuration

| Parameter | Value |
|-----------|-------|
| **Proxy URL** | ${PROXY_URL} |
| **Test Duration** | ~3 minutes (multiple scenarios) |
| **Scenarios** | Public endpoints, Authenticated (warm/cold cache), Authorization endpoint, Stress test |

## Results Summary

### HTTP Performance

| Metric | Value |
|--------|-------|
| **Requests/sec** | ${requests_per_sec} |
| **p95 Latency** | ${p95_duration} |
| **p99 Latency** | ${p99_duration} |

### Cache Performance

| Cache Type | Hits | Misses | Hit Rate |
|------------|------|--------|----------|
| **User Context (Redis)** | ${cache_hits} | ${cache_misses} | ${user_cache_rate}% |
| **OPA Decisions (In-Memory)** | ${opa_cache_hits} | ${opa_cache_misses} | ${opa_cache_rate}% |

### Detailed Metrics from Prometheus

\`\`\`
$(cat /tmp/post-metrics.txt 2>/dev/null | grep -E "^authorizer_proxy_(http|opa|cache|api|authorization)" | head -50 || echo "Metrics not available")
\`\`\`

## Test Scenarios Executed

### 1. Public Endpoints (30s, 10 VUs)
- Health check and ready endpoints
- No authentication required
- Baseline for proxy overhead measurement

### 2. Authenticated - Warm Cache (30s, 20 VUs)
- Same user (dam_operator) making repeated requests
- Tests Redis user context cache effectiveness
- Tests OPA decision cache effectiveness

### 3. Authenticated - Cold Cache (10 VUs, 5 iterations each)
- Multiple users with unique query parameters
- Forces cache misses for realistic worst-case scenarios
- Tests full authorization flow including API calls

### 4. Authorization Endpoint (30s, 15 VUs)
- Direct calls to /authorize endpoint
- Tests OPA policy evaluation performance
- Measures authorization decision latency

### 5. Stress Test (60s, ramping 5-50 VUs)
- Mixed request types under increasing load
- Tests system stability and degradation patterns

## k6 Output

\`\`\`
$(cat /tmp/k6-output.txt 2>/dev/null | tail -80 || echo "Output not available")
\`\`\`

## Recommendations

Based on these results:

1. **Cache Tuning**: If cache hit rate is below 80%, consider:
   - Increasing Redis TTL for user context
   - Increasing OPA decision cache TTL

2. **OPA Performance**: If OPA evaluation time is high (>50ms p95):
   - Review policy complexity
   - Consider policy optimization
   - Add more specific caching rules

3. **Scale Considerations**: For production:
   - Consider Redis clustering for high availability
   - Deploy multiple proxy instances behind a load balancer
   - Monitor memory usage for OPA decision cache

---
*Report generated by benchmark runner script*
EOF

    log_info "Report saved to: $REPORT_FILE"
}

# Main execution
main() {
    echo "=============================================="
    echo "  CWMS Authorization Proxy Benchmark"
    echo "=============================================="
    echo ""

    check_prerequisites
    fetch_pre_metrics
    run_benchmark
    fetch_post_metrics
    generate_report

    echo ""
    log_info "Benchmark complete!"
    log_info "Report: $REPORT_FILE"
    echo ""
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  PROXY_URL      Authorization proxy URL (default: http://localhost:3001)"
        echo "  KEYCLOAK_URL   Keycloak URL (default: http://localhost:8080)"
        exit 0
        ;;
    *)
        main
        ;;
esac
