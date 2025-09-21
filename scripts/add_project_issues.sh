#!/usr/bin/env bash
set -euo pipefail

# Script to add comprehensive project issues to GitHub project
# Usage: bash scripts/add_project_issues.sh --owner OWNER --repo REPO --project-number NUMBER

OWNER=""
REPO=""
PROJECT_NUMBER=""
DRY_RUN=false

while [ "$#" -gt 0 ]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --project-number) PROJECT_NUMBER="$2"; shift 2;;
    --dry-run) DRY_RUN=true; shift 1;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ -z "$PROJECT_NUMBER" ]; then
  echo "Error: --owner, --repo, and --project-number are required." >&2
  exit 1
fi

# Check if GitHub CLI is available
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) not found. Please install it first." >&2
  exit 1
fi

# Check authentication
if ! gh auth status >/dev/null 2>&1; then
  echo "Error: Not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

# Get or create milestone for Phase 2 - Polish
echo "Getting milestone for Phase 2 - Polish..."
MILESTONE_POLISH=$(gh api repos/$OWNER/$REPO/milestones --jq '.[] | select(.title == "Phase 2 – Polish") | .number' 2>/dev/null | head -n1)
if [ -z "$MILESTONE_POLISH" ] || [ "$MILESTONE_POLISH" = "null" ]; then
  echo "Creating milestone for Phase 2 - Polish..."
  MILESTONE_POLISH=$(gh api repos/$OWNER/$REPO/milestones -X POST -f title="Phase 2 – Polish" --jq '.number' 2>/dev/null || echo "0")
fi

# Get or create milestone for Phase 3 - Stretch  
echo "Getting milestone for Phase 3 - Stretch..."
MILESTONE_STRETCH=$(gh api repos/$OWNER/$REPO/milestones --jq '.[] | select(.title == "Phase 3 – Stretch") | .number' 2>/dev/null | head -n1)
if [ -z "$MILESTONE_STRETCH" ] || [ "$MILESTONE_STRETCH" = "null" ]; then
  echo "Creating milestone for Phase 3 - Stretch..."
  MILESTONE_STRETCH=$(gh api repos/$OWNER/$REPO/milestones -X POST -f title="Phase 3 – Stretch" --jq '.number' 2>/dev/null || echo "0")
fi

echo "Milestones: Phase 2 (#$MILESTONE_POLISH), Phase 3 (#$MILESTONE_STRETCH)"

# Create labels
echo "Creating labels..."
LABELS=("area:importer" "area:translator" "area:tts" "area:ui" "area:infra" "area:docs" "area:qa" "priority:p1" "priority:p2" "priority:p3")

for label in "${LABELS[@]}"; do
  if ! gh api "repos/$OWNER/$REPO/labels/$label" >/dev/null 2>&1; then
    echo "Creating label: $label"
    case "$label" in
      area:*) gh api repos/$OWNER/$REPO/labels -X POST -f name="$label" -f color="1f77b4" -f description="Focus area" >/dev/null ;;
      priority:p1) gh api repos/$OWNER/$REPO/labels -X POST -f name="$label" -f color="e53935" -f description="High priority" >/dev/null ;;
      priority:p2) gh api repos/$OWNER/$REPO/labels -X POST -f name="$label" -f color="fb8c00" -f description="Medium priority" >/dev/null ;;
      priority:p3) gh api repos/$OWNER/$REPO/labels -X POST -f name="$label" -f color="ffb300" -f description="Low priority" >/dev/null ;;
    esac
  fi
done

# Function to create an issue and add to project
create_issue() {
  local title="$1"
  local body="$2"
  local milestone="$3"
  local labels="$4"
  local size="$5"
  local area="$6"
  local priority="$7"
  
  echo "Creating issue: $title"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY-RUN] Would create issue: $title"
    echo "[DRY-RUN] Labels: $labels"
    echo "[DRY-RUN] Milestone: $milestone"
    return
  fi
  
  # Create the issue
  local issue_number
  local create_args=("repos/$OWNER/$REPO/issues" -X POST --jq '.number')
  create_args+=(--raw-field "title=$title")
  create_args+=(--raw-field "body=$body")
  
  if [ "$milestone" != "0" ] && [ -n "$milestone" ]; then
    create_args+=(-F "milestone=$milestone")
  fi
  
  # Add labels one by one
  IFS=',' read -ra LABEL_ARRAY <<< "$labels"
  for label in "${LABEL_ARRAY[@]}"; do
    label=$(echo "$label" | sed 's/^ *//;s/ *$//')  # trim whitespace
    if [ -n "$label" ]; then
      create_args+=(--raw-field "labels[]=$label")
    fi
  done
  
  issue_number=$(gh api "${create_args[@]}")
  
  echo "Created issue #$issue_number: $title"
}

# Phase 2 - Polish Issues (Importer focus)

create_issue \
"Importer 3(B).1 — Select extractor (pdf-parse vs pdfjs-dist) and implement src/extract.ts" \
"Decide extractor library; justify in README. Implement src/extract.ts to yield page-wise text blocks with bbox. Output a stable, testable structure." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "M" "Importer" "p1"

create_issue \
"Importer 3(B).2 — normalize.ts (diacritics, ligatures, whitespace)" \
"Preserve UTF-8 diacritics; convert ﬁ/ﬂ; normalize spaces; keep hard linebreaks only when semantically meaningful." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "S" "Importer" "p1"

create_issue \
"Importer 3(B).3 — line-break hyphen repair" \
"Join soft hyphens across line wraps; keep true lexical hyphens. Add fixtures & tests for both cases." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "S" "Importer" "p1"

create_issue \
"Importer 3(B).4 — parse.ts (ragged columns → rows)" \
"Detect table columns by bbox spans; fallback to multi-space split; support dual-table cluster (Ancient/Modern) and single-table layouts." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "L" "Importer" "p1"

create_issue \
"Importer 3(B).5 — schema.ts with zod models" \
"Define Entry { english, ancient?, modern?, pos?, notes?, sacred:false }. Validate all parsed rows." \
"$MILESTONE_POLISH" "area:importer,priority:p2" "XS" "Importer" "p2"

create_issue \
"Importer 3(B).6 — build.ts emit ancient.json & modern.json" \
"Merge rows; resolve conflicts; prefer mundane; write JSON under lib/translator/dictionaries. Emit ALL_ROWS.csv, VARIANTS.csv, EXCLUDED.txt, REPORT.md." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "M" "Importer" "p1"

create_issue \
"Importer 3(B).7 — maintain exclude_terms.txt + policy" \
"Ship data/exclude_terms.txt; filter divine/pantheon/Comoară terms. Document policy." \
"$MILESTONE_POLISH" "area:importer,priority:p2" "S" "Importer" "p2"

create_issue \
"Importer 3(B).8 — CLI entry & repo script (pnpm dict:build)" \
"Create tools/dict-importer CLI; add root script 'pnpm dict:build' to emit JSON dictionaries." \
"$MILESTONE_POLISH" "area:importer,priority:p1" "S" "Importer" "p1"

create_issue \
"Importer 3(B).9 — tests: normalize, parse, conflict resolution" \
"Vitest tests for diacritics, hyphen repair, column parsing, conflict policy." \
"$MILESTONE_POLISH" "area:qa,area:importer,priority:p1" "M" "QA" "p1"

create_issue \
"Importer 3(B).10 — performance on large PDFs" \
"Profile and avoid O(n^2) joins; batch parse; streaming if needed; doc optimizations." \
"$MILESTONE_POLISH" "area:importer,priority:p2" "M" "Importer" "p2"

# Integration issues
create_issue \
"Integration — hot-reload dictionaries without redeploy" \
"Watch dict files; reload in-memory maps on change; expose /api/admin/reload (protected in dev)." \
"$MILESTONE_POLISH" "area:translator,priority:p2" "S" "Translator" "p2"

create_issue \
"Integration — unknown token logger & patch loop" \
"Collect [unknown] tokens during translation; write to /build/UNKNOWN_TOKENS.csv to aid lexicon growth." \
"$MILESTONE_POLISH" "area:translator,priority:p1" "S" "Translator" "p1"

create_issue \
"Integration — budget guardrails & rate limiting" \
"Implement DAILY/MONTHLY caps; MAX_CHARS_PER_TTS; allowed-model allowlist; 429 retry w/ backoff." \
"$MILESTONE_POLISH" "area:tts,area:infra,priority:p1" "S" "Infra" "p1"

create_issue \
"TTS caching — content hash → audio file reuse" \
"Hash Librán text + voice + format; reuse audio if cache hit; store in /outputs/audio." \
"$MILESTONE_POLISH" "area:tts,priority:p1" "S" "TTS" "p1"

create_issue \
"Error taxonomy & user-facing messages" \
"Normalize API errors; map to friendly UI strings; add server logs with correlation ids." \
"$MILESTONE_POLISH" "area:infra,priority:p2" "S" "Infra" "p2"

# UI polish
create_issue \
"UI — clipboard copy & filename template" \
"Add copy buttons for Librán text; filename template: {variant}-{hash}-{ts}.mp3." \
"$MILESTONE_POLISH" "area:ui,priority:p2" "XS" "UI" "p2"

create_issue \
"UI — voice preview & quick A/B test" \
"Short sample per voice; toggle voices; persist last used settings." \
"$MILESTONE_POLISH" "area:ui,area:tts,priority:p2" "S" "UI" "p2"

create_issue \
"UI — accessibility pass" \
"Focus order, labels, aria-live for audio ready; keyboard shortcuts." \
"$MILESTONE_POLISH" "area:ui,priority:p2" "S" "UI" "p2"

# Docs
create_issue \
"Docs — Importer design notes & exclude policy" \
"Expand docs/DICTIONARY_FORMAT.md; add exclude rationale; conflict examples." \
"$MILESTONE_POLISH" "area:docs,priority:p2" "XS" "Docs" "p2"

create_issue \
"Docs — Operating guide (budgets, caching, limits)" \
"README: budgets, model allowlist, MAX_CHARS, caching behavior, troubleshooting." \
"$MILESTONE_POLISH" "area:docs,priority:p2" "XS" "Docs" "p2"

# QA / CI
create_issue \
"CI — importer tests + translator edge cases" \
"Add workflow to run importer + translator test suites on PRs; report coverage." \
"$MILESTONE_POLISH" "area:qa,area:infra,priority:p1" "S" "QA" "p1"

create_issue \
"CI — lint/typecheck gates as required status checks" \
"Expose lint/typecheck as named checks (lint, types); mark required in ruleset." \
"$MILESTONE_POLISH" "area:infra,priority:p1" "XS" "Infra" "p1"

# Phase 3 - Stretch
create_issue \
"Batch renderer — scripts → stitched mp3" \
"CLI to ingest a text file, split on headings, render batch audio, stitch, cue sheet." \
"$MILESTONE_STRETCH" "area:tts,priority:p3" "M" "TTS" "p3"

create_issue \
"Subtitle export — SRT/VTT (English + Librán)" \
"Generate aligned subtitle files; optional timestamps from TTS duration estimate." \
"$MILESTONE_STRETCH" "area:tts,priority:p3" "S" "TTS" "p3"

create_issue \
"Realtime voice POC — WebRTC page" \
"Small demo using Realtime API for live NPC lines; document limits." \
"$MILESTONE_STRETCH" "area:tts,priority:p3" "L" "TTS" "p3"

create_issue \
"Audio normalization — loudness & sample rate" \
"Post-process mp3/wav to target loudness; normalize sample rate to 44.1k/48k." \
"$MILESTONE_STRETCH" "area:tts,priority:p3" "S" "TTS" "p3"

create_issue \
"Observability — request metrics & simple dash" \
"Count requests, cache hits, chars processed; expose /metrics (dev) or log JSON." \
"$MILESTONE_STRETCH" "area:infra,priority:p3" "M" "Infra" "p3"

echo "All issues created successfully!"
