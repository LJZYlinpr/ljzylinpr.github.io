#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v bundle >/dev/null 2>&1; then
  echo "bundle not found. Activate the conda environment first: conda activate homepage"
  exit 1
fi

if [ ! -d vendor/bundle ]; then
  bundle config set --local path 'vendor/bundle'
  bundle install
fi

bundle exec jekyll serve --host 127.0.0.1 --port 4000 --livereload
