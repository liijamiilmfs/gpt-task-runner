# Data Directory Structure

This directory contains the Librán Dictionary data organized for optimal AI training and data management.

## Directory Structure

- **dictionaries/**: Main dictionary files
  - **current/**: Latest versions
  - **baseline/**: Reference versions
  - **archive/**: Historical versions

- **tranches/**: Thematic word collections
  - **core/**: Core grammar and nature
  - **concepts/**: Abstract concepts
  - **living/**: Living things
  - **society/**: Social and political
  - **craft/**: Crafting and materials
  - **culture/**: Cultural and specialized

- **reference/**: Reference materials
  - **pdfs/**: PDF files
  - **guides/**: Text guides
  - **samples/**: Sample data

- **training/**: Training and validation data
  - **csv/**: CSV data
  - **exclusions/**: Exclusion lists
  - **validation/**: Validation datasets

- **workflow/**: Workflow management
  - **approved/**: Approved entries
  - **proposed/**: Proposed entries
  - **rejected/**: Rejected entries

- **config/**: Configuration files

## Adding New Data

When adding new data:
1. Place files in the appropriate directory
2. Update the AI priming system configuration
3. Run the training pipeline

## Backup

A backup of the original structure is available at: ../data-backup/
