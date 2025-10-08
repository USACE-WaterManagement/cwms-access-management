#!/bin/bash

# Load OPA whitelist from opa-whitelist.json into .env file
# This script is the recommended way to update the whitelist configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WHITELIST_FILE="$PROJECT_ROOT/opa-whitelist.json"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE_FILE="$PROJECT_ROOT/.env.example"

echo "Loading OPA whitelist from opa-whitelist.json..."
echo ""

# Check if opa-whitelist.json exists
if [ ! -f "$WHITELIST_FILE" ]; then
    echo "Error: opa-whitelist.json not found"
    echo ""
    echo "Create opa-whitelist.json in the project root:"
    echo "  cp opa-whitelist.example.json opa-whitelist.json"
    exit 1
fi

# Validate JSON
echo "Validating JSON..."
if ! jq empty "$WHITELIST_FILE" 2>/dev/null; then
    echo "Error: Invalid JSON in opa-whitelist.json"
    exit 1
fi

# Check if it's an array
if ! jq -e 'if type == "array" then true else false end' "$WHITELIST_FILE" > /dev/null; then
    echo "Error: opa-whitelist.json must contain a JSON array"
    exit 1
fi

# Count endpoints
ENDPOINT_COUNT=$(jq 'length' "$WHITELIST_FILE")
echo "Found $ENDPOINT_COUNT endpoints"
echo ""

# Read the whitelist (compact JSON, no newlines or spaces)
WHITELIST_CONTENT=$(cat "$WHITELIST_FILE" | jq -c .)

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: .env file not found"
    echo "Creating .env from .env.example..."
    if [ -f "$ENV_EXAMPLE_FILE" ]; then
        cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
        echo "Created .env from template"
    else
        echo "Error: .env.example not found"
        exit 1
    fi
    echo ""
fi

# Update or add OPA_WHITELIST_ENDPOINTS in .env
echo "Updating .env file..."

# Check if OPA_WHITELIST_ENDPOINTS exists in .env
if grep -q "^OPA_WHITELIST_ENDPOINTS=" "$ENV_FILE"; then
    # Update existing line
    sed "s|^OPA_WHITELIST_ENDPOINTS=.*|OPA_WHITELIST_ENDPOINTS=$WHITELIST_CONTENT|" "$ENV_FILE" > "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "Updated OPA_WHITELIST_ENDPOINTS in .env"
elif grep -q "^# OPA_WHITELIST_ENDPOINTS=" "$ENV_FILE"; then
    # Uncomment and update
    sed "s|^# OPA_WHITELIST_ENDPOINTS=.*|OPA_WHITELIST_ENDPOINTS=$WHITELIST_CONTENT|" "$ENV_FILE" > "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "Uncommented and updated OPA_WHITELIST_ENDPOINTS in .env"
else
    # Add at the end
    echo "" >> "$ENV_FILE"
    echo "# OPA Whitelist loaded from opa-whitelist.json" >> "$ENV_FILE"
    echo "OPA_WHITELIST_ENDPOINTS=$WHITELIST_CONTENT" >> "$ENV_FILE"
    echo "Added OPA_WHITELIST_ENDPOINTS to .env"
fi

echo ""
echo "Successfully loaded whitelist with $ENDPOINT_COUNT endpoints"
echo ""
echo "Next steps:"
echo "  1. Review .env file: cat .env | grep OPA_WHITELIST"
echo "  2. Recreate container (not just restart):"
echo "     podman compose -f docker-compose.podman.yml down authorizer-proxy"
echo "     podman compose -f docker-compose.podman.yml up -d authorizer-proxy"
echo "  3. Verify: podman logs authorizer-proxy | grep 'count'"
echo "     Should show: count:$ENDPOINT_COUNT"
echo ""
