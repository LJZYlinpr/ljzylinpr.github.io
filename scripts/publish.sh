#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

message="${1:-update homepage}"

git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$message"
git push origin master

echo "Pushed to origin/master"
