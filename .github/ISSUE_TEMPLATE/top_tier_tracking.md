name: TopTier tracking epic
description: Track a TopTier milestone epic and its child tasks
title: "epic(toptier): <milestone name>"
labels: ["toptier", "docs"]
body:
  - type: markdown
    attributes:
      value: |
        This epic groups work to complete a TopTier milestone.

  - type: input
    id: milestone
    attributes:
      label: Milestone
      placeholder: e.g., M1: Governance & CI foundations
    validations:
      required: true

  - type: textarea
    id: goals
    attributes:
      label: Goals
      placeholder: Key outcomes of this milestone

  - type: textarea
    id: tasks
    attributes:
      label: Linked tasks
      description: Link child issues using GitHub task list syntax.
      placeholder: |
        - [ ] #123 Add CODEOWNERS
        - [ ] #124 Add PR template
