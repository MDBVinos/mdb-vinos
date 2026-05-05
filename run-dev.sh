#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if command -v npm >/dev/null 2>&1; then
  npm run dev
else
  /Applications/Codex.app/Contents/Resources/node .tools/npm/bin/npm-cli.js run dev
fi
