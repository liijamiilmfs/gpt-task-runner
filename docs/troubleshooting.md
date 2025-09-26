# GPT Task Runner - Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the GPT Task Runner.

## Error Codes Reference

The GPT Task Runner uses structured error codes to help identify and resolve issues. Each error code provides:

- **User-friendly message**: What the error means in plain language
- **Suggested action**: What you should do to resolve the issue
- **Documentation links**: Additional resources where applicable

### API and Transport Errors

#### E_RATE_LIMIT (Exit Code: 10)

**What it means**: You've exceeded the rate limit for API requests.

**Common causes**:

- Making too many requests too quickly
- Large batch sizes overwhelming the API
- Multiple concurrent operations

**How to fix**:

- Wait a few minutes before retrying
- Reduce your batch size using `--batch-size`
- Space out your requests
- Check your OpenAI account's rate limits

**Documentation**: [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

#### E_TIMEOUT (Exit Code: 11)

**What it means**: Your request took too long to complete and timed out.

**Common causes**:

- Slow network connection
- Large requests taking too long to process
- Server overload

**How to fix**:

- Check your internet connection
- Increase timeout settings
- Retry the operation
- Reduce request complexity

#### E_AUTH (Exit Code: 12)

**What it means**: Authentication failed - your API key is invalid or missing.

**Common causes**:

- Missing or incorrect API key
- Expired API key
- Insufficient permissions

**How to fix**:

- Verify your API key is correct
- Check your OpenAI account status
- Ensure your API key has the necessary permissions
- Generate a new API key if needed

**Documentation**: [OpenAI Authentication](https://platform.openai.com/docs/api-reference/authentication)

#### E_INPUT (Exit Code: 13)

**What it means**: The input you provided is invalid or malformed.

**Common causes**:

- Missing required fields
- Invalid data format
- Malformed JSON or CSV

**How to fix**:

- Check your input file format
- Ensure all required fields are present
- Validate your data structure
- Use `--dry-run` to test your input

#### E_QUOTA (Exit Code: 14)

**What it means**: You've exceeded your usage quota or have billing issues.

**Common causes**:

- Monthly usage limit exceeded
- Insufficient account balance
- Billing information issues

**How to fix**:

- Check your OpenAI account billing
- Add payment method or increase limits
- Monitor your usage
- Upgrade your plan if needed

**Documentation**: [OpenAI Billing](https://platform.openai.com/account/billing)

#### E_SERVER_ERROR (Exit Code: 15)

**What it means**: The OpenAI servers are experiencing issues.

**Common causes**:

- OpenAI service outage
- Server overload
- Temporary service issues

**How to fix**:

- Wait a few minutes and retry
- Check OpenAI status page
- Use smaller batch sizes
- Try again later

**Documentation**: [OpenAI Status](https://status.openai.com/)

#### E_NETWORK (Exit Code: 16)

**What it means**: Network connection problems preventing requests.

**Common causes**:

- Internet connection issues
- Firewall blocking requests
- DNS resolution problems

**How to fix**:

- Check your internet connection
- Verify firewall settings
- Try a different network
- Check DNS settings

### File and I/O Errors

#### E_FILE_NOT_FOUND (Exit Code: 20)

**What it means**: The specified file doesn't exist.

**Common causes**:

- Incorrect file path
- File was moved or deleted
- Typo in filename

**How to fix**:

- Verify the file path is correct
- Check if the file exists
- Use absolute paths if needed
- Check file permissions

#### E_FILE_PERMISSION (Exit Code: 21)

**What it means**: You don't have permission to access the file.

**Common causes**:

- Insufficient file permissions
- File is locked by another process
- Running without proper privileges

**How to fix**:

- Check file permissions
- Run with elevated privileges if needed
- Close other applications using the file
- Change file ownership if necessary

#### E_FILE_FORMAT (Exit Code: 22)

**What it means**: The file format is not supported or corrupted.

**Common causes**:

- Wrong file extension
- Corrupted file
- Unsupported encoding

**How to fix**:

- Ensure file is CSV or JSONL format
- Check file encoding (UTF-8 recommended)
- Recreate the file if corrupted
- Validate file structure

#### E_FILE_CORRUPT (Exit Code: 23)

**What it means**: The file contains corrupted or invalid data.

**Common causes**:

- File transfer corruption
- Incomplete file write
- Data corruption

**How to fix**:

- Use a backup file
- Recreate the file
- Check file integrity
- Verify data source

### Validation Errors

#### E_VALIDATION (Exit Code: 30)

**What it means**: Your data failed validation checks.

**Common causes**:

- Invalid field values
- Missing required data
- Data type mismatches

**How to fix**:

- Review validation error details
- Check data types and formats
- Ensure required fields are present
- Use schema validation tools

#### E_SCHEMA (Exit Code: 31)

**What it means**: Your data doesn't match the expected schema.

**Common causes**:

- Wrong field names
- Incorrect data structure
- Missing required fields

**How to fix**:

- Check field names and types
- Ensure data matches expected schema
- Use provided schema documentation
- Validate data before processing

#### E_REQUIRED_FIELD (Exit Code: 32)

**What it means**: A required field is missing from your data.

**Common causes**:

- Incomplete data entry
- Missing columns in CSV
- Empty required fields

**How to fix**:

- Add missing required fields
- Check CSV headers
- Ensure all required data is provided
- Review data completeness

#### E_INVALID_FORMAT (Exit Code: 33)

**What it means**: The data format is incorrect.

**Common causes**:

- Wrong data type
- Invalid format strings
- Malformed data

**How to fix**:

- Check data format requirements
- Convert data to correct format
- Validate format strings
- Use proper data types

### Configuration Errors

#### E_CONFIG (Exit Code: 40)

**What it means**: Configuration error in your setup.

**Common causes**:

- Invalid configuration values
- Missing configuration files
- Environment variable issues

**How to fix**:

- Check configuration files
- Verify environment variables
- Review configuration documentation
- Reset to default configuration

#### E_CONFIG_MISSING (Exit Code: 41)

**What it means**: Required configuration is missing.

**Common causes**:

- Missing environment variables
- Incomplete configuration files
- Unset required settings

**How to fix**:

- Set required environment variables
- Complete configuration files
- Check configuration requirements
- Use configuration templates

#### E_CONFIG_INVALID (Exit Code: 42)

**What it means**: Configuration values are invalid.

**Common causes**:

- Wrong configuration format
- Invalid values
- Out-of-range settings

**How to fix**:

- Check configuration value formats
- Verify value ranges
- Use valid configuration options
- Reset invalid settings

### System Errors

#### E_MEMORY (Exit Code: 50)

**What it means**: Insufficient memory available.

**Common causes**:

- Large batch sizes
- System memory pressure
- Memory leaks

**How to fix**:

- Reduce batch size
- Close other applications
- Restart the system
- Monitor memory usage

#### E_DISK_SPACE (Exit Code: 51)

**What it means**: Insufficient disk space available.

**Common causes**:

- Full disk drive
- Large output files
- Temporary file accumulation

**How to fix**:

- Free up disk space
- Clean temporary files
- Move data to another drive
- Increase disk capacity

#### E_PROCESS (Exit Code: 52)

**What it means**: Process execution failed.

**Common causes**:

- System resource limits
- Process conflicts
- System instability

**How to fix**:

- Restart the application
- Check system resources
- Resolve process conflicts
- Update system components

### Business Logic Errors

#### E_BATCH_FAILED (Exit Code: 60)

**What it means**: Batch processing failed for some tasks.

**Common causes**:

- Individual task failures
- Mixed success/failure scenarios
- Partial batch completion

**How to fix**:

- Review failed task details
- Use `--only-failed` to retry failed tasks
- Check individual task errors
- Adjust batch composition

#### E_CHECKPOINT (Exit Code: 61)

**What it means**: Checkpoint operation failed.

**Common causes**:

- File permission issues
- Disk space problems
- Corrupted checkpoint files

**How to fix**:

- Check checkpoint file permissions
- Ensure sufficient disk space
- Delete corrupted checkpoints
- Use different checkpoint location

#### E_RESUME (Exit Code: 62)

**What it means**: Resume operation failed.

**Common causes**:

- Missing checkpoint files
- Corrupted checkpoint data
- Version incompatibility

**How to fix**:

- Verify checkpoint file exists
- Check checkpoint file integrity
- Start fresh if checkpoint is corrupted
- Update to compatible version

## Common Solutions

### Quick Diagnostic Steps

1. **Check the error code and exit code** - Use this guide to understand what went wrong
2. **Review the suggested action** - Follow the specific guidance for your error
3. **Use `--verbose` flag** - Get more detailed error information
4. **Try `--dry-run`** - Test your configuration without making actual API calls
5. **Check logs** - Review detailed logs for additional context

### Getting Help

If you continue to experience issues:

1. **Check the error code** in this guide for specific solutions
2. **Review the logs** with `--verbose` for detailed information
3. **Try with smaller batch sizes** to isolate the issue
4. **Use `--dry-run`** to test your setup
5. **Check OpenAI status** for service issues
6. **Verify your configuration** and environment setup

### Best Practices

- **Start small**: Test with small batches before processing large datasets
- **Use dry-run**: Always test your configuration with `--dry-run` first
- **Monitor usage**: Keep track of your API usage and costs
- **Handle failures gracefully**: Use `--resume` and `--only-failed` for large jobs
- **Keep backups**: Maintain backups of important data and configurations
- **Stay updated**: Keep the GPT Task Runner updated to the latest version

## Exit Code Summary

| Exit Code | Error Type            | Description                              |
| --------- | --------------------- | ---------------------------------------- |
| 0         | SUCCESS               | Operation completed successfully         |
| 1         | SUCCESS_WITH_WARNINGS | Operation completed with warnings        |
| 10-16     | API Errors            | Rate limit, auth, timeout, etc.          |
| 20-23     | File Errors           | File not found, permission, format, etc. |
| 30-33     | Validation Errors     | Data validation, schema, format issues   |
| 40-42     | Config Errors         | Configuration problems                   |
| 50-52     | System Errors         | Memory, disk space, process issues       |
| 60-62     | Business Logic        | Batch, checkpoint, resume failures       |
| 70-71     | Generic Errors        | Unknown or internal errors               |
| 80-81     | Special Cases         | Partial success, dry run success         |
