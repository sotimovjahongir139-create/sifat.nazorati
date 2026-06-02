#!/usr/bin/env bash
# Pull latest from origin/main and restart the PM2 app.
# Local uncommitted changes are auto-stashed and re-applied.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="sifat-nazorati"
HEALTH_URL="http://localhost:3001/"

cd "$REPO_DIR"

echo "==> Repo: $REPO_DIR"
echo "==> Branch: $(git rev-parse --abbrev-ref HEAD)"

STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "==> Stashing local changes"
  git stash push -u -m "redeploy.sh auto-stash $(date +%s)"
  STASHED=1
fi

echo "==> Pulling origin/main (rebase)"
git pull --rebase origin main

if [ "$STASHED" -eq 1 ]; then
  echo "==> Restoring stashed changes"
  if ! git stash pop; then
    echo "!! Stash pop hit conflicts. Resolve manually: git status"
    exit 1
  fi
fi

echo "==> Restarting PM2 app: $APP_NAME"
pm2 restart "$APP_NAME" --update-env

sleep 2

echo "==> Health check: $HEALTH_URL"
HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$HEALTH_URL" || echo "000")"
if [ "$HTTP_CODE" = "200" ]; then
  echo "==> OK (HTTP $HTTP_CODE)"
else
  echo "!! Unhealthy (HTTP $HTTP_CODE). Check: pm2 logs $APP_NAME"
  exit 1
fi
