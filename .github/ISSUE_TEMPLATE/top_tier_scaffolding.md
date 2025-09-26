name: TopTier scaffolding task
description: Track a TopTier organizational or quality scaffold task
title: "chore(toptier): <short description>"
labels: ["chore", "toptier"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Use this template to propose or track a TopTier scaffolding task (docs, governance, CI, security, quality gates, etc.).

  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: What is the outcome of this scaffolding task?
      placeholder: e.g., Add CODEOWNERS and governance policies, update lint/test thresholds
    validations:
      required: true

  - type: textarea
    id: scope
    attributes:
      label: Scope
      description: Which areas and files will be affected?
      placeholder: e.g., .github/, docs/, README.md, workflows/*

  - type: dropdown
    id: category
    attributes:
      label: Category
      options:
        - Governance
        - Docs
        - CI/CD
        - Security
        - Testing
        - Release process
        - DevEx
        - Other

  - type: input
    id: milestone
    attributes:
      label: Target milestone
      placeholder: e.g., M1: Governance & CI foundations (2025-10-10)

  - type: checkboxes
    id: acceptance
    attributes:
      label: Acceptance criteria
      options:
        - label: Changes documented in docs/
        - label: CI passes on branch and PR
        - label: Lint/type-check/test thresholds respected
        - label: Assigned reviewers approve

  - type: textarea
    id: tasks
    attributes:
      label: Tasks
      description: List actionable steps.
      placeholder: |
        - [ ] Step 1
        - [ ] Step 2
