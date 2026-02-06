#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-193.151.152.32}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/spool/asterisk/monitor/2026/02/04}"
DEST_DIR="${DEST_DIR:-recordings/2026/02/04}"
INTERVAL_SEC="${INTERVAL_SEC:-30}"
WATCH_MODE="false"

usage() {
  cat <<'USAGE'
Usage: fetch_recordings.sh [--watch] [--interval SECONDS] [DEST_DIR]

Environment variables:
  REMOTE_HOST   Remote host (default: 193.151.152.32)
  REMOTE_USER   SSH user (default: root)
  REMOTE_DIR    Remote recordings directory
  DEST_DIR      Local destination directory (can be overridden by argument)
  INTERVAL_SEC  Watch interval in seconds (default: 30)
  SSH_PASSWORD  Required: password for SSH
  SSH_PASSWORD_FILE  Optional: path to file containing SSH password

Examples:
  SSH_PASSWORD='***' ./scripts/fetch_recordings.sh
  SSH_PASSWORD='***' ./scripts/fetch_recordings.sh --watch --interval 15 recordings/2026/02/04
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch)
      WATCH_MODE="true"
      shift
      ;;
    --interval)
      INTERVAL_SEC="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      DEST_DIR="$1"
      shift
      ;;
  esac
done

if [[ -z "${SSH_PASSWORD:-}" && -n "${SSH_PASSWORD_FILE:-}" ]]; then
  SSH_PASSWORD="$(cat "${SSH_PASSWORD_FILE}")"
fi

if [[ -z "${SSH_PASSWORD:-}" ]]; then
  echo "SSH_PASSWORD or SSH_PASSWORD_FILE is required to fetch recordings." >&2
  exit 1
fi

mkdir -p "${DEST_DIR}"

askpass_script="$(mktemp)"
cat > "${askpass_script}" <<'ASKPASS'
#!/usr/bin/env bash
printf '%s\n' "${SSH_PASSWORD}"
ASKPASS
chmod 700 "${askpass_script}"

cleanup() {
  rm -f "${askpass_script}"
}
trap cleanup EXIT

run_rsync() {
  SSH_ASKPASS="${askpass_script}" \
  SSH_ASKPASS_REQUIRE=force \
  DISPLAY=1 \
  setsid -w rsync -av \
    -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
    --include='*/' \
    --include='*.wav' \
    --exclude='*' \
    --ignore-existing \
    "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/" \
    "${DEST_DIR}/"
}

if [[ "${WATCH_MODE}" == "true" ]]; then
  echo "Watching for new recordings every ${INTERVAL_SEC}s..."
  while true; do
    run_rsync || true
    sleep "${INTERVAL_SEC}"
  done
else
  run_rsync
  echo "Recordings copied to ${DEST_DIR}"
fi
