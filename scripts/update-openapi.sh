#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cd "$repo_root/backend"
PYTHONPATH=. uv run python -c \
  'import json; from app.main import app; print(json.dumps(app.openapi()))' \
  > "$tmp_dir/openapi.json"

cd "$repo_root/frontend"
npx --no-install openapi-typescript "$tmp_dir/openapi.json" \
  -o "$tmp_dir/schema.d.ts"

mv "$tmp_dir/openapi.json" src/api/openapi.json
mv "$tmp_dir/schema.d.ts" src/api/schema.d.ts

echo "OpenAPI JSON and TypeScript schema updated atomically."
