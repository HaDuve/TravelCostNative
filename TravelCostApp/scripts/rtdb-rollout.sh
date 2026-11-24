#!/usr/bin/env bash
# Production rollout of the trip-membership RTDB rules (#426).
# See docs/rtdb-rules.md. Run from anywhere; every step that changes
# production asks for confirmation first.
#
#   scripts/rtdb-rollout.sh preflight   # read-only checks
#   scripts/rtdb-rollout.sh backfill    # back up, then add missing trip memberships
#   scripts/rtdb-rollout.sh deploy      # fresh backfill, rules tests, deploy, verify
#   scripts/rtdb-rollout.sh verify      # anonymous access is refused
#   scripts/rtdb-rollout.sh rollback    # redeploy the previous rules (signed-in only)
#
# Backups and update files go to $ROLLOUT_DIR (default ~/rtdb-rollout/<timestamp>).
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT="travelcostnative"
INSTANCE="travelcostnative-default-rtdb"
DB_URL="https://${INSTANCE}.asia-southeast1.firebasedatabase.app"
API_KEY="AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE"
# The rules that were live before #426 ("auth != null"), for rollback.
ROLLBACK_COMMIT="85ea250"
# FIREBASE_CLI overrides the CLI (used to test this script against the emulator).
read -r -a FIREBASE <<<"${FIREBASE_CLI:-pnpm dlx firebase-tools@15.5.1}"
ROLLOUT_DIR="${ROLLOUT_DIR:-$HOME/rtdb-rollout/$(date +%Y%m%d-%H%M%S)}"

fb() { "${FIREBASE[@]}" --project "$PROJECT" "$@"; }

say() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

confirm() {
  local answer
  read -r -p "$1 [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || fail "Stopped, nothing more was changed."
}

http_code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

preflight() {
  say "Preflight (read-only)"
  local ok=1

  if [[ -n "$(git status --porcelain -- .)" ]]; then
    echo "  ! Uncommitted changes in TravelCostApp/"; ok=0
  fi
  git fetch -q origin main || true
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
    echo "  ! Not on the latest origin/main"; ok=0
  else
    echo "  ok  on latest origin/main"
  fi

  if java -version 2>&1 | grep -Eq 'version "(2[1-9]|[3-9][0-9])'; then
    echo "  ok  Java 21+"
  else
    echo "  ! Java 21+ is required for the rules tests (brew install openjdk@21)"; ok=0
  fi

  if fb login:list 2>/dev/null | grep -q '@'; then
    echo "  ok  firebase login"
  else
    echo "  ! Not logged in: run: ${FIREBASE[*]} login"; ok=0
  fi

  local refresh
  refresh=$(curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=${API_KEY}" \
    -H 'Content-Type: application/json' \
    -d '{"grant_type":"refresh_token","refresh_token":"bogus"}')
  if grep -q INVALID_REFRESH_TOKEN <<<"$refresh"; then
    echo "  ok  token refresh allowed on the API key"
  else
    echo "  ! Token Service blocked on the API key (see docs/firebase-auth-api-key.md)"; ok=0
  fi

  local anon
  anon=$(http_code "${DB_URL}/.json?shallow=true")
  if [[ "$anon" == "401" ]]; then
    echo "  ok  anonymous read refused (401)"
  else
    echo "  ! anonymous read returned ${anon}"; ok=0
  fi

  [[ $ok == 1 ]] || fail "Preflight failed."
  echo
  echo "Preflight passed. Make sure the app update (OTA) with trip membership"
  echo "has reached most active devices before running 'deploy'."
}

backfill() {
  mkdir -p "$ROLLOUT_DIR"
  local backup="$ROLLOUT_DIR/database-backup.json"
  local update="$ROLLOUT_DIR/members-update.json"

  say "Backing up the whole database to $backup"
  fb database:get / --output "$backup"
  [[ -s "$backup" ]] || fail "Backup is empty."
  ls -lh "$backup" | awk '{print "  size: " $5}'

  say "Computing missing trip memberships"
  node scripts/backfill-trip-members.js --backup "$backup" >"$update" 2>"$ROLLOUT_DIR/backfill-stats.json"
  echo "  $(cat "$ROLLOUT_DIR/backfill-stats.json")"
  local count
  count=$(node -e 'console.log(Object.keys(require(process.argv[1])).length)' "$update")
  if [[ "$count" == "0" ]]; then
    echo "  Nothing to add: every trip already lists its members."
    return 0
  fi
  echo "  First entries:"
  head -n 6 "$update" | sed 's/^/    /'

  confirm "Add ${count} trip memberships to production (additive only)?"
  fb database:update / "$update" --force
  echo "  Applied. Update file kept at $update"
}

verify() {
  say "Verifying production"
  local anon
  anon=$(http_code "${DB_URL}/.json?shallow=true")
  [[ "$anon" == "401" ]] || fail "Anonymous read returned ${anon}, expected 401."
  echo "  ok  anonymous GET /.json -> 401"
  anon=$(http_code "${DB_URL}/trips.json?shallow=true")
  [[ "$anon" == "401" ]] || fail "Anonymous trips read returned ${anon}, expected 401."
  echo "  ok  anonymous GET /trips.json -> 401"
}

deploy() {
  preflight
  backfill

  say "Running the rules emulator tests"
  pnpm test:rules

  say "Rules to deploy (database.rules.json)"
  cat database.rules.json

  confirm "Deploy these rules to production?"
  pnpm deploy:rules
  verify

  cat <<EOF

Deployed. For the next 48 h:
  - ${FIREBASE[*]} --project ${PROJECT} database:profile --duration 600
    (watch Permission Denied counts)
  - check the [AUTH-FAILURE] logs and the RTDB downloads graph
  - if Travellers are locked out: scripts/rtdb-rollout.sh rollback
EOF
}

rollback() {
  local tmp
  tmp=$(mktemp -d)
  git show "${ROLLBACK_COMMIT}:TravelCostApp/database.rules.json" >"$tmp/database.rules.json"
  printf '{"database":{"rules":"database.rules.json"}}\n' >"$tmp/firebase.json"

  say "Rules to roll back to (from ${ROLLBACK_COMMIT})"
  cat "$tmp/database.rules.json"
  confirm "Deploy these rules to production?"
  (cd "$tmp" && "${FIREBASE[@]}" --project "$PROJECT" deploy --only database)
  verify
  echo "Rolled back. Re-run the backfill and investigate before deploying again."
}

case "${1:-}" in
  preflight) preflight ;;
  backfill) backfill ;;
  deploy) deploy ;;
  verify) verify ;;
  rollback) rollback ;;
  *)
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
