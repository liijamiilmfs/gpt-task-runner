#!/usr/bin/env bash
set -euo pipefail

# POSIX-compatible Bash script for provisioning GitHub Projects (beta) resources.

usage() {
  cat <<'USAGE'
Usage: setup_github_project.sh --owner OWNER --repo REPO [options]

Options:
  --owner OWNER             GitHub organization or user that owns the project (required)
  --repo REPO               Repository name (required)
  --project-name NAME       Project title (default: Librán Voice Forge)
  --visibility VISIBILITY   Project visibility: PUBLIC or PRIVATE (default: PRIVATE)
  --project-description TXT Project short description (default provided)
  --dry-run                 Print actions without applying mutations
  -h, --help                Show this help message
USAGE
}

OWNER=""
REPO=""
PROJECT_NAME="Librán Voice Forge"
VISIBILITY="PRIVATE"
PROJECT_DESCRIPTION="English → (Ancient|Modern) Librán → OpenAI TTS audio."
DRY_RUN=false
CREATED_LABELS=""
ISSUE_SUMMARY=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    --project-name)
      PROJECT_NAME="$2"
      shift 2
      ;;
    --visibility)
      VISIBILITY="$2"
      shift 2
      ;;
    --project-description)
      PROJECT_DESCRIPTION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Error: --owner and --repo are required." >&2
  usage >&2
  exit 1
fi

upper_vis=$(printf '%s' "$VISIBILITY" | tr '[:lower:]' '[:upper:]')
if [ "$upper_vis" != "PUBLIC" ] && [ "$upper_vis" != "PRIVATE" ]; then
  echo "Error: --visibility must be PUBLIC or PRIVATE" >&2
  exit 1
fi
VISIBILITY="$upper_vis"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found. Please install it before running this script." >&2
    exit 1
  fi
}

require_command gh
require_command jq

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh auth status failed. Please authenticate using 'gh auth login'." >&2
  exit 1
fi

log() {
  printf '%s\n' "$*"
}

warn() {
  printf 'Warning: %s\n' "$*" >&2
}

run_mutation() {
  # $1: GraphQL query, rest: key value pairs
  local query="$1"
  shift
  local args=(graphql --silent --raw-field "query=$query")
  while [ "$#" -gt 0 ]; do
    args+=(--raw-field "$1=$2")
    shift 2
  done
  if $DRY_RUN; then
    log "[DRY-RUN] gh api ${args[*]}"
    printf '{}'
  else
    gh api "${args[@]}"
  fi
}

run_query() {
  local query="$1"
  shift
  local args=(graphql --silent --raw-field "query=$query")
  while [ "$#" -gt 0 ]; do
    args+=(--raw-field "$1=$2")
    shift 2
  done
  gh api "${args[@]}"
}

urlencode() {
  # shellcheck disable=SC2039
  jq -rn --arg v "$1" '$v|@uri'
}

OWNER_KIND=""
OWNER_ID=""

determine_owner() {
  # Simplified approach - try to get owner info directly
  local response
  response=$(gh api "users/$OWNER" 2>/dev/null || echo "{}")
  if [ "$(printf '%s' "$response" | jq -r '.type // empty')" = "User" ]; then
    OWNER_KIND="USER"
    OWNER_ID=$(printf '%s' "$response" | jq -r '.node_id // empty')
  else
    # Try as organization
    response=$(gh api "orgs/$OWNER" 2>/dev/null || echo "{}")
    if [ "$(printf '%s' "$response" | jq -r '.type // empty')" = "Organization" ]; then
      OWNER_KIND="ORG"
      OWNER_ID=$(printf '%s' "$response" | jq -r '.node_id // empty')
    else
      echo "Error: Unable to resolve owner '$OWNER' as user or organization." >&2
      exit 1
    fi
  fi
  
  if [ -z "$OWNER_ID" ] || [ "$OWNER_ID" = "null" ]; then
    echo "Error: Unable to get node ID for owner '$OWNER'." >&2
    exit 1
  fi
}

determine_owner

log "Resolved owner $OWNER as $OWNER_KIND with id $OWNER_ID"

# Debug: Check if we can access the repository
log "Checking repository access..."
if ! gh api "repos/$OWNER/$REPO" >/dev/null 2>&1; then
  echo "Error: Cannot access repository $OWNER/$REPO" >&2
  exit 1
fi
log "Repository access confirmed"

PROJECT_ID=""
PROJECT_NUMBER=""
PROJECT_URL=""

fetch_project() {
  log "Fetching existing projects..."
  read -r -d '' QUERY_PROJECT <<'GRAPHQL'
query($owner: String!, $title: String!) {
  user(login: $owner) {
    projectsV2(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { id number title url shortDescription public }
    }
  }
  organization(login: $owner) {
    projectsV2(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { id number title url shortDescription public }
    }
  }
}
GRAPHQL
  local response
  response=$(run_query "$QUERY_PROJECT" owner "$OWNER" title "$PROJECT_NAME")
  log "Project query response received"
  PROJECT_ID=$(printf '%s' "$response" | jq -r --arg title "$PROJECT_NAME" '.data.user.projectsV2.nodes[]?, .data.organization.projectsV2.nodes[]? | select(.title == $title) | .id' | head -n 1)
  PROJECT_NUMBER=$(printf '%s' "$response" | jq -r --arg title "$PROJECT_NAME" '.data.user.projectsV2.nodes[]?, .data.organization.projectsV2.nodes[]? | select(.title == $title) | .number' | head -n 1)
  PROJECT_URL=$(printf '%s' "$response" | jq -r --arg title "$PROJECT_NAME" '.data.user.projectsV2.nodes[]?, .data.organization.projectsV2.nodes[]? | select(.title == $title) | .url' | head -n 1)
  PROJECT_PUBLIC=$(printf '%s' "$response" | jq -r --arg title "$PROJECT_NAME" '.data.user.projectsV2.nodes[]?, .data.organization.projectsV2.nodes[]? | select(.title == $title) | .public' | head -n 1)
  PROJECT_DESCRIPTION_EXISTING=$(printf '%s' "$response" | jq -r --arg title "$PROJECT_NAME" '.data.user.projectsV2.nodes[]?, .data.organization.projectsV2.nodes[]? | select(.title == $title) | .shortDescription' | head -n 1)
  log "Project fetch completed. Found project ID: $PROJECT_ID"
}

fetch_project

if [ -z "$PROJECT_ID" ]; then
  read -r -d '' MUTATION_CREATE_PROJECT <<'GRAPHQL'
mutation($ownerId: ID!, $title: String!, $desc: String, $isPublic: Boolean!) {
  projectV2Create(input: {ownerId: $ownerId, title: $title, shortDescription: $desc, public: $isPublic}) {
    projectV2 { id number url }
  }
}
GRAPHQL
  local response
  local is_public
  if [ "$VISIBILITY" = "PUBLIC" ]; then
    is_public=true
  else
    is_public=false
  fi
  response=$(run_mutation "$MUTATION_CREATE_PROJECT" ownerId "$OWNER_ID" title "$PROJECT_NAME" desc "$PROJECT_DESCRIPTION" isPublic "$is_public")
  if [ "$DRY_RUN" = false ]; then
    PROJECT_ID=$(printf '%s' "$response" | jq -r '.data.projectV2Create.projectV2.id')
    PROJECT_NUMBER=$(printf '%s' "$response" | jq -r '.data.projectV2Create.projectV2.number')
    PROJECT_URL=$(printf '%s' "$response" | jq -r '.data.projectV2Create.projectV2.url')
  else
    PROJECT_ID="DRY_PROJECT_ID"
    PROJECT_NUMBER="DRY"
    PROJECT_URL="https://github.com/orgs/$OWNER/projects"
  fi
  log "Created project '$PROJECT_NAME'"
else
  log "Reusing existing project '$PROJECT_NAME'"
  if [ "$VISIBILITY" = "PUBLIC" ]; then
    desired_public=true
  else
    desired_public=false
  fi
  if [ "$DRY_RUN" = false ] && { [ "$PROJECT_PUBLIC" != "$desired_public" ] || [ "$PROJECT_DESCRIPTION_EXISTING" != "$PROJECT_DESCRIPTION" ]; }; then
    read -r -d '' MUTATION_UPDATE_PROJECT <<'GRAPHQL'
mutation($projectId: ID!, $title: String!, $desc: String, $isPublic: Boolean!) {
  projectV2Update(input: {projectId: $projectId, title: $title, shortDescription: $desc, public: $isPublic}) {
    projectV2 { id }
  }
}
GRAPHQL
    run_mutation "$MUTATION_UPDATE_PROJECT" projectId "$PROJECT_ID" title "$PROJECT_NAME" desc "$PROJECT_DESCRIPTION" isPublic "$desired_public" >/dev/null
  fi
fi

if [ "$DRY_RUN" = false ] && [ -z "$PROJECT_URL" ]; then
  # fetch url if not set
  fetch_project
fi

log "Project number: $PROJECT_NUMBER"

get_fields_json() {
  read -r -d '' QUERY_FIELDS <<'GRAPHQL'
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      fields(first: 50) {
        nodes {
          id
          name
          dataType
          ... on ProjectV2SingleSelectField {
            options {
              id
              name
              nameHtml
              position
            }
          }
          ... on ProjectV2FieldCommon {
            id
          }
        }
      }
    }
  }
}
GRAPHQL
  run_query "$QUERY_FIELDS" projectId "$PROJECT_ID" | jq -r '.data.node.fields.nodes'
}

PROJECT_FIELDS_JSON=""
if [ "$DRY_RUN" = false ]; then
  PROJECT_FIELDS_JSON=$(get_fields_json)
fi

ensure_single_select_field() {
  # $1 field name, $2 comma-separated options in order
  local field_name="$1"
  local options_csv="$2"
  local field_id=""
  if [ "$DRY_RUN" = false ]; then
    field_id=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$field_name" 'map(select(.name == $name)) | .[0].id // empty')
  fi
  if [ -z "$field_id" ]; then
    read -r -d '' MUTATION_CREATE_FIELD <<'GRAPHQL'
mutation($projectId: ID!, $name: String!) {
  projectV2FieldCreate(input: {projectId: $projectId, name: $name, dataType: SINGLE_SELECT}) {
    projectV2Field { id }
  }
}
GRAPHQL
    if [ "$DRY_RUN" = true ]; then
      log "[DRY-RUN] Would create field '$field_name'"
      field_id="DRY_FIELD_${field_name// /_}"
    else
      local resp
      resp=$(run_mutation "$MUTATION_CREATE_FIELD" projectId "$PROJECT_ID" name "$field_name")
      field_id=$(printf '%s' "$resp" | jq -r '.data.projectV2FieldCreate.projectV2Field.id')
      PROJECT_FIELDS_JSON=$(get_fields_json)
    fi
  fi
  local IFS=","; set -- $options_csv
  local idx=0
  for option in "$@"; do
    option=$(printf '%s' "$option" | sed 's/^ *//;s/ *$//')
    idx=$((idx + 1))
    local option_id=""
    if [ "$DRY_RUN" = false ]; then
      option_id=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$field_name" --arg option "$option" '
        map(select(.name == $name)) | .[0].options[]? | select(.name == $option) | .id' | head -n 1)
    fi
    if [ -z "$option_id" ]; then
      read -r -d '' MUTATION_OPTION_CREATE <<'GRAPHQL'
mutation($projectId: ID!, $fieldId: ID!, $name: String!, $position: Int!) {
  projectV2SingleSelectFieldOptionCreate(input: {projectId: $projectId, fieldId: $fieldId, name: $name, position: $position}) {
    option { id }
  }
}
GRAPHQL
      if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would add option '$option' to field '$field_name'"
      else
        run_mutation "$MUTATION_OPTION_CREATE" projectId "$PROJECT_ID" fieldId "$field_id" name "$option" position "$idx" >/dev/null
        PROJECT_FIELDS_JSON=$(get_fields_json)
      fi
    else
      if [ "$DRY_RUN" = false ]; then
        read -r -d '' MUTATION_OPTION_UPDATE <<'GRAPHQL'
mutation($projectId: ID!, $fieldId: ID!, $optionId: ID!, $name: String!, $position: Int!) {
  projectV2SingleSelectFieldOptionUpdate(input: {projectId: $projectId, fieldId: $fieldId, optionId: $optionId, name: $name, position: $position}) {
    option { id }
  }
}
GRAPHQL
        run_mutation "$MUTATION_OPTION_UPDATE" projectId "$PROJECT_ID" fieldId "$field_id" optionId "$option_id" name "$option" position "$idx" >/dev/null
      else
        log "[DRY-RUN] Would ensure option '$option' order for field '$field_name'"
      fi
    fi
  done
}

ensure_text_field() {
  local field_name="$1"
  if [ "$DRY_RUN" = false ]; then
    local existing
    existing=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$field_name" 'map(select(.name == $name)) | .[0].id // empty')
    if [ -z "$existing" ]; then
      read -r -d '' MUTATION_TEXT_FIELD <<'GRAPHQL'
mutation($projectId: ID!, $name: String!) {
  projectV2FieldCreate(input: {projectId: $projectId, name: $name, dataType: TEXT}) {
    projectV2Field { id }
  }
}
GRAPHQL
      run_mutation "$MUTATION_TEXT_FIELD" projectId "$PROJECT_ID" name "$field_name" >/dev/null
      PROJECT_FIELDS_JSON=$(get_fields_json)
    fi
  else
    log "[DRY-RUN] Would ensure text field '$field_name'"
  fi
}

ensure_date_field() {
  local field_name="$1"
  if [ "$DRY_RUN" = false ]; then
    local existing
    existing=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$field_name" 'map(select(.name == $name)) | .[0].id // empty')
    if [ -z "$existing" ]; then
      read -r -d '' MUTATION_DATE_FIELD <<'GRAPHQL'
mutation($projectId: ID!, $name: String!) {
  projectV2FieldCreate(input: {projectId: $projectId, name: $name, dataType: DATE}) {
    projectV2Field { id }
  }
}
GRAPHQL
      run_mutation "$MUTATION_DATE_FIELD" projectId "$PROJECT_ID" name "$field_name" >/dev/null
      PROJECT_FIELDS_JSON=$(get_fields_json)
    fi
  else
    log "[DRY-RUN] Would ensure date field '$field_name'"
  fi
}

if [ "$DRY_RUN" = false ]; then
  ensure_single_select_field "Status" "Todo,In Progress,In Review,Blocked,Done"
  ensure_single_select_field "Priority" "P0,P1,P2,P3"
  ensure_single_select_field "Size" "XS,S,M,L,XL"
  ensure_single_select_field "Area" "Translator,TTS,Importer,UI,Infra,Docs,QA"
  ensure_text_field "Target"
  ensure_date_field "Due Date"
  PROJECT_FIELDS_JSON=$(get_fields_json)
else
  log "[DRY-RUN] Would ensure project fields (Status, Priority, Size, Area, Target, Due Date)"
fi

if [ "$DRY_RUN" = false ]; then
  STATUS_FIELD_ID=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r 'map(select(.name == "Status"))[0].id')
  TODO_OPTION_ID=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r 'map(select(.name == "Status"))[0].options[] | select(.name == "Todo") | .id')
  read -r -d '' MUTATION_STATUS_DEFAULT <<'GRAPHQL'
mutation($projectId: ID!, $fieldId: ID!, $optionId: ID!) {
  projectV2FieldUpdate(input: {projectId: $projectId, fieldId: $fieldId, name: "Status", defaultValue: {singleSelectOptionId: $optionId}}) {
    projectV2Field { id }
  }
}
GRAPHQL
  run_mutation "$MUTATION_STATUS_DEFAULT" projectId "$PROJECT_ID" fieldId "$STATUS_FIELD_ID" optionId "$TODO_OPTION_ID" >/dev/null
else
  log "[DRY-RUN] Would set default Status to Todo"
fi

ensure_view() {
  # $1 name, $2 type (BOARD/TABLE), $3 filter, $4 group field name, $5 sort field name, $6 sort direction, $7 group parameter, $8 columns CSV
  local view_name="$1"
  local view_type="$2"
  local filter="$3"
  local group_field="$4"
  local sort_field="$5"
  local sort_dir="$6"
  local group_by="$7"
  local columns="$8"
  if [ "$DRY_RUN" = true ]; then
    log "[DRY-RUN] Would ensure view '$view_name'"
    return
  fi
  read -r -d '' QUERY_VIEWS <<'GRAPHQL'
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      views(first: 20) {
        nodes { id name layout filter }
      }
    }
  }
}
GRAPHQL
  local resp
  resp=$(run_query "$QUERY_VIEWS" projectId "$PROJECT_ID")
  local existing_id
  existing_id=$(printf '%s' "$resp" | jq -r --arg name "$view_name" '.data.node.views.nodes[]? | select(.name == $name) | .id' | head -n 1)
  if [ -z "$existing_id" ]; then
    read -r -d '' MUTATION_VIEW_CREATE <<'GRAPHQL'
mutation($projectId: ID!, $name: String!, $layout: ProjectV2ViewLayout!, $filter: String) {
  projectV2ViewCreate(input: {projectId: $projectId, name: $name, layout: $layout, filter: $filter}) {
    projectV2View { id }
  }
}
GRAPHQL
    local layout
    if [ "$view_type" = "BOARD" ]; then
      layout="BOARD"
    else
      layout="TABLE"
    fi
    local create_resp
    create_resp=$(run_mutation "$MUTATION_VIEW_CREATE" projectId "$PROJECT_ID" name "$view_name" layout "$layout" filter "$filter")
    existing_id=$(printf '%s' "$create_resp" | jq -r '.data.projectV2ViewCreate.projectV2View.id // empty')
  fi
  if [ -z "$existing_id" ]; then
    warn "Could not ensure view '$view_name'"
    return
  fi
  read -r -d '' MUTATION_VIEW_UPDATE <<'GRAPHQL'
mutation($projectId: ID!, $viewId: ID!, $configuration: ProjectV2ViewConfigurationInput!, $filter: String) {
  projectV2ViewUpdate(input: {projectId: $projectId, viewId: $viewId, configuration: $configuration, filter: $filter}) {
    projectV2View { id }
  }
}
GRAPHQL
  local configuration
  configuration="{\"groupBy\":null,\"sortBy\":null,\"visibleFields\":null}"
  if [ -n "$group_field" ]; then
    local group_field_id
    group_field_id=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$group_field" 'map(select(.name == $name))[0].id // empty')
    if [ -n "$group_field_id" ]; then
      configuration=$(printf '%s' "$configuration" | jq --arg id "$group_field_id" '.groupBy = {fieldId: $id}')
    fi
  fi
  if [ -n "$sort_field" ]; then
    local sort_field_id
    sort_field_id=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$sort_field" 'map(select(.name == $name))[0].id // empty')
    if [ -n "$sort_field_id" ]; then
      local dir
      dir=$(printf '%s' "$sort_dir" | tr '[:lower:]' '[:upper:]')
      [ "$dir" = "ASC" ] || dir="DESC"
      configuration=$(printf '%s' "$configuration" | jq --arg id "$sort_field_id" --arg dir "$dir" '.sortBy = {fieldId: $id, direction: $dir}')
    fi
  fi
  if [ -n "$columns" ]; then
    local json_columns
    json_columns=$(printf '%s' "$columns" | jq -R 'split(",") | map(gsub("^ +"; "") | gsub(" +$"; ""))')
    configuration=$(printf '%s' "$configuration" | jq --argjson cols "$json_columns" '.visibleFields = $cols')
  fi
  if [ -n "$group_by" ]; then
    configuration=$(printf '%s' "$configuration" | jq --arg group "$group_by" '.groupBy = (.groupBy // {}) + {mode: $group}')
  fi
  configuration=$(printf '%s' "$configuration" | jq -c '.')
  run_mutation "$MUTATION_VIEW_UPDATE" projectId "$PROJECT_ID" viewId "$existing_id" configuration "$configuration" filter "$filter" >/dev/null
}

if [ "$DRY_RUN" = false ]; then
  ensure_view "Kanban" "BOARD" "-status:Done" "Status" "Priority" "ASC" "STATUS" ""
  ensure_view "Backlog" "TABLE" "status:Todo" "" "" "" "" "Title,Status,Priority,Size,Area"
  ensure_view "Roadmap" "TABLE" "" "" "" "" "MILESTONE" "Due Date"
else
  log "[DRY-RUN] Would ensure Kanban, Backlog, and Roadmap views"
fi

label_color_for() {
  case "$1" in
    area:translator) printf '1f77b4' ;;
    area:tts) printf 'ff7f0e' ;;
    area:importer) printf '2ca02c' ;;
    area:ui) printf 'd62728' ;;
    area:infra) printf '9467bd' ;;
    area:docs) printf '8c564b' ;;
    area:qa) printf '17becf' ;;
    priority:p0) printf 'b71c1c' ;;
    priority:p1) printf 'e53935' ;;
    priority:p2) printf 'fb8c00' ;;
    priority:p3) printf 'ffb300' ;;
    status:blocked) printf '000000' ;;
    "good first issue") printf '7057ff' ;;
    *) printf 'cccccc' ;;
  esac
}

ensure_label() {
  local label="$1"
  local color
  color=$(label_color_for "$label")
  local encoded
  encoded=$(urlencode "$label")
  local endpoint="repos/$OWNER/$REPO/labels/$encoded"
  if gh api "$endpoint" >/dev/null 2>&1; then
    return
  fi
  local description=""
  case "$label" in
    area:*) description="Focus area" ;;
    priority:*) description="Priority level" ;;
    status:blocked) description="Issue is blocked" ;;
    "good first issue") description="Good for new contributors" ;;
  esac
  if $DRY_RUN; then
    log "[DRY-RUN] Would create label '$label'"
    return
  fi
  gh api repos/$OWNER/$REPO/labels -X POST -f name="$label" -f color="$color" -f description="$description" >/dev/null
}

LABELS_TO_ENSURE="area:translator area:tts area:importer area:ui area:infra area:docs area:qa priority:p0 priority:p1 priority:p2 priority:p3 status:blocked good first issue"
for label in $LABELS_TO_ENSURE; do
  ensure_label "$label"
  CREATED_LABELS="$CREATED_LABELS $label"
done

ensure_milestone() {
  local title="$1"
  local endpoint="repos/$OWNER/$REPO/milestones?state=all&per_page=100"
  local existing
  existing=$(gh api "$endpoint" --jq "map(select(.title == \"$title\"))[0].number" 2>/dev/null || true)
  if [ -n "$existing" ] && [ "$existing" != "null" ]; then
    printf '%s' "$existing"
    return
  fi
  if $DRY_RUN; then
    log "[DRY-RUN] Would create milestone '$title'"
    printf '0'
  else
    gh api repos/$OWNER/$REPO/milestones -X POST -f title="$title" --jq '.number'
  fi
}

MILESTONE_PHASE0=$(ensure_milestone "Phase 0 – Infra")
MILESTONE_PHASE1=$(ensure_milestone "Phase 1 – MVP")
MILESTONE_PHASE2=$(ensure_milestone "Phase 2 – Polish")
MILESTONE_PHASE3=$(ensure_milestone "Phase 3 – Stretch")

issue_body() {
  local description="$1"
  cat <<EOB
## Summary
$description

## Acceptance Criteria
- [ ] Defined tasks completed
- [ ] Documentation updated as needed
EOB
}

find_issue_number() {
  local title="$1"
  read -r -d '' QUERY_ISSUE <<'GRAPHQL'
query($owner: String!, $repo: String!, $title: String!) {
  search(query: $title, type: ISSUE, first: 20) {
    nodes {
      ... on Issue {
        number
        title
        repository { owner { login } name }
        id
      }
    }
  }
}
GRAPHQL
  local search_query
  search_query=$(printf 'repo:%s/%s in:title "%s"' "$OWNER" "$REPO" "$title")
  local resp
  resp=$(run_query "$QUERY_ISSUE" owner "$OWNER" repo "$REPO" title "$search_query")
  printf '%s' "$resp" | jq -r --arg title "$title" --arg owner "$OWNER" --arg repo "$REPO" '.data.search.nodes[]? | select(.title == $title and .repository.owner.login == $owner and .repository.name == $repo) | .number' | head -n 1
}

get_issue_node_id() {
  local number="$1"
  run_query 'query($owner:String!, $repo:String!, $number:Int!){ repository(owner:$owner, name:$repo) { issue(number:$number) { id } } }' owner "$OWNER" repo "$REPO" number "$number" | jq -r '.data.repository.issue.id'
}

ensure_issue() {
  local title="$1"
  local description="$2"
  local milestone="$3"
  local labels_csv="$4"
  local size_label="$5"
  local area_option="$6"
  local priority_option="$7"
  local status_option="Todo"
  local issue_number
  issue_number=$(find_issue_number "$title")
  local body
  body=$(issue_body "$description")
  local all_labels=""
  if [ -n "$labels_csv" ]; then
    all_labels=$(printf '%s' "$labels_csv" | tr ',' ' ')
  fi
  if [ -n "$priority_option" ]; then
    all_labels="$all_labels priority:${priority_option}" 
  fi
  if [ -z "$issue_number" ]; then
    if $DRY_RUN; then
      log "[DRY-RUN] Would create issue '$title'"
      issue_number="0"
    else
      local create_args=("repos/$OWNER/$REPO/issues" -X POST --jq '.number')
      create_args+=(--raw-field "title=$title")
      create_args+=(--raw-field "body=$body")
      if [ -n "$milestone" ] && [ "$milestone" != "0" ]; then
        create_args+=(-F "milestone=$milestone")
      fi
      for lbl in $all_labels; do
        [ -n "$lbl" ] || continue
        create_args+=(--raw-field "labels[]=$lbl")
      done
      issue_number=$(gh api "${create_args[@]}")
    fi
  else
    if $DRY_RUN; then
      log "[DRY-RUN] Would update issue #$issue_number '$title'"
    else
      local update_args=("repos/$OWNER/$REPO/issues/$issue_number" -X PATCH)
      update_args+=(--raw-field "title=$title")
      update_args+=(--raw-field "body=$body")
      if [ -n "$milestone" ] && [ "$milestone" != "0" ]; then
        update_args+=(-F "milestone=$milestone")
      fi
      for lbl in $all_labels; do
        [ -n "$lbl" ] || continue
        update_args+=(--raw-field "labels[]=$lbl")
      done
      gh api "${update_args[@]}" >/dev/null
    fi
  fi
  ensure_project_item "$issue_number" "$size_label" "$area_option" "$priority_option" "$status_option"
  ISSUE_SUMMARY=$(printf '%s\n%s' "$ISSUE_SUMMARY" "$issue_number:$title:$status_option")
}

ensure_project_item() {
  local issue_number="$1"
  local size_option="$2"
  local area_option="$3"
  local priority_option="$4"
  local status_option="$5"
  if [ "$DRY_RUN" = true ]; then
    log "[DRY-RUN] Would ensure project item for issue #$issue_number"
    return
  fi
  local issue_node
  issue_node=$(get_issue_node_id "$issue_number")
  if [ -z "$issue_node" ] || [ "$issue_node" = "null" ]; then
    warn "Unable to locate node id for issue #$issue_number"
    return
  fi
  read -r -d '' QUERY_ITEMS <<'GRAPHQL'
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 200) {
        nodes {
          id
          content { ... on Issue { id number } }
        }
      }
    }
  }
}
GRAPHQL
  local resp
  resp=$(run_query "$QUERY_ITEMS" projectId "$PROJECT_ID")
  local item_id
  item_id=$(printf '%s' "$resp" | jq -r --arg issue "$issue_node" '.data.node.items.nodes[]? | select(.content.id == $issue) | .id' | head -n 1)
  if [ -z "$item_id" ]; then
    read -r -d '' MUTATION_ADD_ITEM <<'GRAPHQL'
mutation($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
    item { id }
  }
}
GRAPHQL
    local add_resp
    add_resp=$(run_mutation "$MUTATION_ADD_ITEM" projectId "$PROJECT_ID" contentId "$issue_node")
    item_id=$(printf '%s' "$add_resp" | jq -r '.data.addProjectV2ItemById.item.id')
  fi
  if [ -z "$item_id" ]; then
    warn "Could not add issue #$issue_number to project"
    return
  fi
  set_field_value "$item_id" "Status" "$status_option"
  if [ -n "$priority_option" ]; then
    local formatted_priority
    formatted_priority=$(printf '%s' "$priority_option" | tr '[:lower:]' '[:upper:]')
    set_field_value "$item_id" "Priority" "$formatted_priority"
  fi
  set_field_value "$item_id" "Size" "$size_option"
  set_field_value "$item_id" "Area" "$area_option"
}

set_field_value() {
  local item_id="$1"
  local field_name="$2"
  local option_name="$3"
  if [ -z "$option_name" ]; then
    return
  fi
  local field
  field=$(printf '%s' "$PROJECT_FIELDS_JSON" | jq -r --arg name "$field_name" 'map(select(.name == $name))[0]')
  local field_id
  field_id=$(printf '%s' "$field" | jq -r '.id')
  local option_id
  option_id=$(printf '%s' "$field" | jq -r --arg option "$option_name" '.options[]? | select(.name == $option) | .id')
  if [ -z "$option_id" ] || [ "$option_id" = "null" ]; then
    warn "Missing option '$option_name' for field '$field_name'"
    return
  fi
  read -r -d '' MUTATION_SET_FIELD <<'GRAPHQL'
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: ID!) {
  updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $optionId}}) {
    projectV2Item { id }
  }
}
GRAPHQL
  run_mutation "$MUTATION_SET_FIELD" projectId "$PROJECT_ID" itemId "$item_id" fieldId "$field_id" optionId "$option_id" >/dev/null
}

seed_issue() {
  local title="$1"
  local description="$2"
  local milestone="$3"
  local labels="$4"
  local size="$5"
  local area="$6"
  local priority="$7"
  ensure_issue "$title" "$description" "$milestone" "$labels" "$size" "$area" "$priority"
}

# Phase 0 – Infra
seed_issue "Initialize Next.js + TypeScript project" "Create Next.js (App Router) scaffold, pnpm setup, ESLint, tsconfig; add basic scripts." "$MILESTONE_PHASE0" "area:infra" "S" "Infra" "p0"
seed_issue "Add OpenAI SDK + env wiring" "Install openai, add .env.example (OPENAI_API_KEY, OPENAI_TTS_MODEL, OPENAI_TTS_VOICE, AUDIO_FORMAT)." "$MILESTONE_PHASE0" "area:infra" "XS" "Infra" "p0"
seed_issue "Repo hygiene & licensing" ".gitignore, LICENSE (MIT), CODE_OF_CONDUCT.md, SECURITY.md, CONTRIBUTING.md." "$MILESTONE_PHASE0" "area:infra" "XS" "Infra" "p1"

# Phase 1 – MVP
seed_issue "Translator core (deterministic)" "Tokenize, dict lookup, stem fallback, sound-shifts (Ancient -or/-on, Modern -a/-ë/-ir), case preserve, punctuation spacing." "$MILESTONE_PHASE1" "area:translator" "M" "Translator" "p0"
seed_issue "Seed dictionaries (demo)" "ancient.json, modern.json with 20–50 demo pairs for flow testing." "$MILESTONE_PHASE1" "area:translator" "XS" "Translator" "p1"
seed_issue "Translate API route" "POST /api/translate { text, variant } -> { libran }." "$MILESTONE_PHASE1" "area:translator" "S" "Translator" "p0"
seed_issue "TTS API route" "POST /api/speak { libranText, voice?, format? } -> audio (mp3/wav)." "$MILESTONE_PHASE1" "area:tts" "S" "TTS" "p0"
seed_issue "UI: English → Librán → Audio" "Textarea, variant toggle, “Translate” + “Speak”, voice select, <audio controls>." "$MILESTONE_PHASE1" "area:ui" "M" "UI" "p0"
seed_issue "Docs: README + Architecture" "High-level overview, quickstart, diagrams, roadmap." "$MILESTONE_PHASE1" "area:docs" "S" "Docs" "p1"

# Phase 2 – Polish
seed_issue "Importer tool: PDF → JSON (Python)" "pdfplumber, regex heuristics, exclude list, build ancient.json/modern.json, reports." "$MILESTONE_PHASE2" "area:importer" "L" "Importer" "p1"
seed_issue "Exclude list & sacred/mundane policy" "Maintain deity/Comoară excludes; variant CSV; notes policy." "$MILESTONE_PHASE2" "area:importer" "S" "Importer" "p2"
seed_issue "Librán accent guide integration" "Optional style preface for cadence; UI toggle." "$MILESTONE_PHASE2" "area:tts" "S" "TTS" "p2"
seed_issue "Basic unit tests" "Translator edge cases (hyphenation, diacritics), API 200s, simple UI test." "$MILESTONE_PHASE2" "area:qa" "S" "QA" "p1"

# Phase 3 – Stretch
seed_issue "LLM “polish” pass (optional)" "Secondary pass to smooth morphosyntax; opt-in flag." "$MILESTONE_PHASE3" "area:translator" "M" "Translator" "p3"
seed_issue "Batch render (narration pages → mp3)" "Upload text, generate stitched audio files." "$MILESTONE_PHASE3" "area:tts" "M" "TTS" "p3"
seed_issue "Realtime voice prototype" "Realtime API trial for live NPC lines." "$MILESTONE_PHASE3" "area:tts" "L" "TTS" "p3"

log "--- Summary ---"
log "Project URL: $PROJECT_URL"
log "Labels ensured: $CREATED_LABELS"
log "Milestones: Phase 0 – Infra (#$MILESTONE_PHASE0), Phase 1 – MVP (#$MILESTONE_PHASE1), Phase 2 – Polish (#$MILESTONE_PHASE2), Phase 3 – Stretch (#$MILESTONE_PHASE3)"

if [ -n "$ISSUE_SUMMARY" ]; then
  printf '%s\n' "Seeded Issues:" 
  printf '%s\n' "Number | Title | Status"
  printf '%s\n' "------ | ----- | ------"
  printf '%s\n' "$ISSUE_SUMMARY" | while IFS=':' read -r num title status; do
    [ -n "$num" ] || continue
    printf '#%s | %s | %s\n' "$num" "$title" "$status"
  done
fi

