#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-all}"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

FRONTEND_HOST="${FRONTEND_HOST:-localhost}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_HOST="${BACKEND_HOST:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-5020}"

export CLIENT_URL="${CLIENT_URL:-http://${FRONTEND_HOST}:${FRONTEND_PORT}}"
export NEXT_PUBLIC_SOCKET_URL="${NEXT_PUBLIC_SOCKET_URL:-http://${BACKEND_HOST}:${BACKEND_PORT}}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

start_backend() {
  echo "Starting backend on http://${BACKEND_HOST}:${BACKEND_PORT}"
  (
    cd "$ROOT_DIR/backend"
    PORT="$BACKEND_PORT" npm run dev
  ) &
  backend_pid=$!
}

start_frontend() {
  echo "Starting frontend on http://${FRONTEND_HOST}:${FRONTEND_PORT}"
  (
    cd "$ROOT_DIR/frontend"
    npm run dev -- --port "$FRONTEND_PORT"
  ) &
  frontend_pid=$!
}

case "$MODE" in
  all)
    echo "Frontend URL: ${CLIENT_URL}"
    echo "Socket URL: ${NEXT_PUBLIC_SOCKET_URL}"
    start_backend
    start_frontend
    wait -n "$backend_pid" "$frontend_pid"
    ;;
  backend)
    echo "Frontend URL: ${CLIENT_URL}"
    start_backend
    wait "$backend_pid"
    ;;
  frontend)
    echo "Socket URL: ${NEXT_PUBLIC_SOCKET_URL}"
    start_frontend
    wait "$frontend_pid"
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [all|backend|frontend]" >&2
    exit 1
    ;;
esac
