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

terminate_process_tree() {
  local pid="$1"
  local child_pid

  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  while IFS= read -r child_pid; do
    if [[ -n "$child_pid" ]]; then
      terminate_process_tree "$child_pid"
    fi
  done < <(pgrep -P "$pid" 2>/dev/null || true)

  kill -TERM "$pid" 2>/dev/null || true

  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return
    fi
    sleep 0.2
  done

  kill -KILL "$pid" 2>/dev/null || true
}

cleanup() {
  terminate_process_tree "$backend_pid"
  terminate_process_tree "$frontend_pid"
}

trap cleanup EXIT INT TERM

start_backend() {
  echo "Starting backend on http://${BACKEND_HOST}:${BACKEND_PORT}"
  (
    cd "$ROOT_DIR/backend"
    export PORT="$BACKEND_PORT"
    exec npm run dev
  ) &
  backend_pid=$!
}

start_frontend() {
  echo "Starting frontend on http://${FRONTEND_HOST}:${FRONTEND_PORT}"
  (
    cd "$ROOT_DIR/frontend"
    exec npm run dev -- --port "$FRONTEND_PORT"
  ) &
  frontend_pid=$!
}

wait_for_first_exit() {
  while true; do
    if [[ -n "$backend_pid" ]] && ! kill -0 "$backend_pid" 2>/dev/null; then
      wait "$backend_pid" || true
      return
    fi

    if [[ -n "$frontend_pid" ]] && ! kill -0 "$frontend_pid" 2>/dev/null; then
      wait "$frontend_pid" || true
      return
    fi

    sleep 0.5
  done
}

case "$MODE" in
  all)
    echo "Frontend URL: ${CLIENT_URL}"
    echo "Socket URL: ${NEXT_PUBLIC_SOCKET_URL}"
    start_backend
    start_frontend
    wait_for_first_exit
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
