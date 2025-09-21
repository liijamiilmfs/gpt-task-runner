# Security Policy

## Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public issue
Security vulnerabilities should be reported privately to avoid potential exploitation.

### 2. Report via email
Send details to: `security@libran-voice-forge.dev`

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. Response timeline
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Resolution**: Within 30 days (depending on complexity)

### 4. Disclosure
We will:
- Work with you to validate and reproduce the issue
- Provide regular updates on our progress
- Credit you in our security advisories (unless you prefer to remain anonymous)
- Coordinate public disclosure after the fix is released

## Security Best Practices

### For Contributors

#### API Keys and Secrets
- **NEVER** commit API keys, passwords, or secrets to the repository
- Use environment variables for all sensitive configuration
- Add new secrets to `.env.example` with placeholder values
- Use `.env.local` for local development (already in `.gitignore`)

#### Code Security
- Validate all user inputs
- Sanitize data before processing
- Use TypeScript for type safety
- Follow OWASP guidelines for web security

#### Dependencies
- Keep dependencies up to date
- Use `pnpm audit` to check for vulnerabilities
- Report security issues in dependencies

### For Users

#### Environment Security
- Keep your OpenAI API key secure
- Use environment variables, not hardcoded values
- Rotate API keys regularly
- Monitor API usage for unusual activity

#### Deployment Security
- Use HTTPS in production
- Keep your server and dependencies updated
- Implement proper access controls
- Monitor logs for suspicious activity

## Security Features

### Current Implementations
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure environment variable handling
- No client-side secret exposure

### Planned Security Enhancements
- [ ] API key rotation reminders
- [ ] Request rate limiting per user
- [ ] Input length limits
- [ ] Audio file size restrictions
- [ ] Content security policy headers

## Known Security Considerations

### OpenAI API Usage
- API keys are server-side only
- No sensitive data is stored locally
- Audio files are generated on-demand
- No persistent storage of user inputs

### Audio Processing
- Audio files are generated in memory
- No permanent storage of generated audio
- Temporary files are cleaned up automatically

### Translation Data
- Dictionary files are read-only
- No user data is stored in translation process
- All processing happens in memory

## Security Audit

We regularly audit our codebase for security issues:

- [ ] Dependency vulnerability scanning
- [ ] Code review for security patterns
- [ ] Input validation testing
- [ ] API security testing
- [ ] Environment variable security

## Contact

For security-related questions or concerns:

- **Security Email**: security@libran-voice-forge.dev
- **General Issues**: Use GitHub Issues (for non-security matters)
- **Discussions**: Use GitHub Discussions for general questions

## Acknowledgments

We appreciate the security research community and welcome responsible disclosure. Contributors who help improve our security will be acknowledged in our security advisories.

---

*Last updated: 2024*










