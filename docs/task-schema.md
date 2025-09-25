# Task Schema Documentation

This document describes the portable task schema used by the GPT Task Runner for standardized input and output formats.

## Schema Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the task (max 100 chars, alphanumeric + hyphens/underscores) |

### Content Fields (At least one required)

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | string | Single prompt text for the task |
| `messages` | Array | Conversation-style messages (alternative to prompt) |

#### Messages Format
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user", 
      "content": "Write a haiku about programming"
    }
  ]
}
```

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `model` | string | OpenAI model to use | `gpt-3.5-turbo` |
| `temperature` | number | Sampling temperature (0-2) | `0.7` |
| `maxTokens` | number | Maximum tokens to generate (1-4096) | `100` |
| `metadata` | object | Additional metadata for the task | `{}` |
| `batch_id` | string | Identifier for the batch this task belongs to | - |
| `corr_id` | string | Correlation ID for tracking | - |
| `idempotency_key` | string | Key for idempotent operations (max 100 chars) | - |

## Supported Models

- `gpt-3.5-turbo`
- `gpt-3.5-turbo-16k`
- `gpt-4`
- `gpt-4-32k`
- `gpt-4-turbo`
- `gpt-4o`
- `gpt-4o-mini`

## File Formats

### JSONL Format

Each line contains a complete JSON object representing a single task:

```jsonl
{"id":"task-1","prompt":"Write a haiku","model":"gpt-3.5-turbo","temperature":0.7,"maxTokens":100}
{"id":"task-2","messages":[{"role":"user","content":"Write a poem"}],"model":"gpt-4","temperature":0.5}
```

### CSV Format

#### Required Headers
- `id` - Task identifier
- `prompt` - Task prompt (or use `messages` column with JSON)

#### Optional Headers
- `messages` - JSON array of message objects
- `model` - OpenAI model name
- `temperature` - Sampling temperature
- `maxTokens` - Maximum tokens
- `metadata` - JSON object with additional data
- `batch_id` - Batch identifier
- `corr_id` - Correlation ID
- `idempotency_key` - Idempotency key

#### Example CSV
```csv
id,prompt,model,temperature,maxTokens,batch_id,idempotency_key,metadata
task-1,"Write a haiku about programming",gpt-3.5-turbo,0.7,100,batch-001,task-1-hash,"{""category"":""creative""}"
task-2,"Explain quantum computing",gpt-4,0.5,500,batch-001,task-2-hash,"{""category"":""educational""}"
```

## Validation Rules

### Field Validation
- **id**: Required, max 100 chars, alphanumeric + hyphens/underscores only
- **prompt**: String, non-empty if provided
- **messages**: Array of objects with `role` and `content` fields
- **model**: String, must be from supported models list
- **temperature**: Number between 0 and 2
- **maxTokens**: Integer between 1 and 4096
- **metadata**: Object (not array or null)
- **idempotency_key**: String, max 100 chars

### Content Validation
- At least one of `prompt` or `messages` must be provided
- If `messages` is provided, each message must have valid `role` and `content`

## Error Handling

Invalid rows are rejected with clear error messages indicating:
- Row number (for CSV/JSONL files)
- Field name with the error
- Specific validation failure reason
- Invalid value (when helpful)

### Example Error Messages
```
Row 2: Required field 'id' is missing or empty
Row 3: Temperature must be between 0 and 2
Row 4: Message role must be "system", "user", or "assistant"
```

## Examples

### Basic Task with Prompt
```json
{
  "id": "task-1",
  "prompt": "Write a haiku about programming",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 100
}
```

### Advanced Task with Messages
```json
{
  "id": "task-2",
  "messages": [
    {
      "role": "system",
      "content": "You are a creative writing assistant."
    },
    {
      "role": "user",
      "content": "Write a short story about a robot learning to paint."
    }
  ],
  "model": "gpt-4",
  "temperature": 0.9,
  "maxTokens": 500,
  "batch_id": "creative-batch-001",
  "idempotency_key": "story-robot-paint-001",
  "metadata": {
    "category": "creative",
    "difficulty": "medium",
    "genre": "science-fiction"
  }
}
```

### Minimal Task
```json
{
  "id": "task-3",
  "prompt": "Hello, world!"
}
```

## Round-trip Compatibility

The schema supports full round-trip compatibility:
- JSONL → Object → JSONL
- CSV → Object → CSV  
- JSONL → Object → CSV
- CSV → Object → JSONL

All field data is preserved during format conversions, with proper handling of:
- JSON serialization/deserialization for complex fields
- CSV escaping for special characters
- Metadata preservation across formats
