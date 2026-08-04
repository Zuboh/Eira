#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cd "$repo_root/backend"
PYTHONPATH=. uv run python -c \
  'import json; from app.main import app; print(json.dumps(app.openapi()))' \
  > "$tmp_dir/openapi.json"

node "$repo_root/scripts/compare-json.mjs" \
  "$repo_root/frontend/src/api/openapi.json" \
  "$tmp_dir/openapi.json"

cd "$repo_root/frontend"
npx --no-install openapi-typescript "$tmp_dir/openapi.json" \
  -o "$tmp_dir/schema.d.ts"
diff -u src/api/schema.d.ts "$tmp_dir/schema.d.ts"

echo "OpenAPI JSON and generated TypeScript are synchronized."
