#!/bin/bash
# Wrapper script to run the CLI from source using tsx
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(dirname "$SCRIPT_DIR")"

# Find the tsx binary
if command -v tsx &> /dev/null; then
    tsx "$CLI_ROOT/src/index.ts" "$@"
elif [ -f "$CLI_ROOT/../../../node_modules/.bin/tsx" ]; then
    "$CLI_ROOT/../../../node_modules/.bin/tsx" "$CLI_ROOT/src/index.ts" "$@"
else
    echo "Error: tsx not found. Please install it with: pnpm add -D tsx"
    exit 1
fi
