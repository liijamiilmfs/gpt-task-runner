#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Syncing labels for $repo"

labels_file=".github/labels.yml"
if [ ! -f "$labels_file" ]; then
  echo "Labels file not found: $labels_file" >&2
  exit 1
fi

# Simple parser for the expected labels.yml structure
name=""; color=""; description=""
flush_label() {
  if [ -n "${name}" ]; then
    existing=$(gh api repos/$repo/labels --paginate -q \
      ".[] | select(.name==\"${name}\") | .name" || true)
    if [ -z "$existing" ]; then
      echo "Creating label: ${name}"
      if ! gh api -X POST repos/$repo/labels -f name="$name" -f color="$color" -f description="$description" >/dev/null 2>&1; then
        echo "Warning: failed to create label '${name}'. Check permissions." >&2
      fi
    else
      echo "Updating label: ${name}"
      if ! gh api -X PATCH repos/$repo/labels/"$(printf %s "$name" | sed 's/ /%20/g')" -f new_name="$name" -f color="$color" -f description="$description" >/dev/null 2>&1; then
        echo "Warning: failed to update label '${name}'. Check permissions." >&2
      fi
    fi
  fi
}

while IFS= read -r line; do
  case "$line" in
    "- name:"*)
      flush_label
      name=$(echo "$line" | sed -E 's/^- name: *//')
      name=${name#"\""}; name=${name%"\""}
      color=""; description=""
      ;;
    "  color:"*)
      color=$(echo "$line" | sed -E 's/^  color: *//')
      color=${color#"\""}; color=${color%"\""}
      ;;
    "  description:"*)
      description=$(echo "$line" | sed -E 's/^  description: *//')
      description=${description#"\""}; description=${description%"\""}
      ;;
  esac
done < "$labels_file"

# Flush last label
flush_label

echo "Labels sync attempted. Some operations may have been skipped if permissions are limited."
