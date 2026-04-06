#!/usr/bin/env bash
# From repo root: bash scripts/docker-up-api-web.sh
# On Git Bash (Windows): MSYS can mangle paths — this script sets MSYS_NO_PATHCONV=1.
set -euo pipefail
cd "$(dirname "$0")/.."

export MSYS_NO_PATHCONV=1

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found in PATH. Start Docker Desktop and ensure 'docker' works in this shell."
  exit 1
fi

echo "==> Building images and starting api + web (postgres + redis start as dependencies)..."
docker compose up -d --build --force-recreate api web

echo ""
echo "==> Containers:"
docker compose ps -a

echo ""
echo "==> URLs (host browser):"
echo "    Web app:  http://localhost:5173"
echo "    API:      http://localhost:3001/api/specialists"
echo "    SEO page: http://localhost:3001/p/<slug>"
echo ""
echo "==> Follow API logs:  docker compose logs -f api"
echo "==> Follow web logs:  docker compose logs -f web"
