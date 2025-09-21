# Vercel Deployment Setup

## Required GitHub Secrets

To deploy to Vercel with secure API keys, you need to set up the following secrets in your GitHub repository:

### 1. Go to Repository Settings
- Navigate to your repository on GitHub
- Click on "Settings" tab
- Click on "Secrets and variables" → "Actions"

### 2. Add the following secrets:

#### `OPENAI_API_KEY`
- **Description**: Your OpenAI API key for TTS functionality
- **Value**: `sk-...` (your actual OpenAI API key)
- **Required**: Yes

#### `VERCEL_TOKEN`
- **Description**: Your Vercel API token
- **Value**: Get from Vercel Dashboard → Settings → Tokens
- **Required**: Yes

#### `VERCEL_ORG_ID`
- **Description**: Your Vercel organization ID
- **Value**: Get from Vercel Dashboard → Settings → General
- **Required**: Yes

#### `VERCEL_PROJECT_ID`
- **Description**: Your Vercel project ID
- **Value**: Get from Vercel Dashboard → Project Settings → General
- **Required**: Yes

### 3. Environment Variables in Vercel

Set these environment variables in your Vercel project dashboard:
- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: `production`
- `LOG_LEVEL`: `info`

## Vercel Configuration

### 1. Connect Repository to Vercel
- Go to Vercel Dashboard
- Import your GitHub repository
- Configure build settings (Next.js will be auto-detected)

### 2. Environment Variables
- Set all required environment variables in Vercel dashboard
- These will be available to your API routes at runtime

## Deployment Process

1. **Push to main branch** → Triggers CI/CD pipeline
2. **Lint & Type Check** → Ensures code quality
3. **Test Suite** → Runs all tests (Node.js + Python)
4. **Build & Security Scan** → Builds application and runs security audit
5. **Deploy to Vercel** → Full Next.js deployment with API routes

## Vercel Advantages

- **API Routes**: Fully supported with serverless functions
- **Server-side features**: Complete Next.js functionality
- **Automatic scaling**: Handles traffic spikes automatically
- **Edge functions**: Global CDN for fast performance
- **Preview deployments**: Automatic previews for PRs

## Security Notes

- API keys are securely stored in Vercel environment variables
- Never commit API keys to the repository
- Vercel provides secure runtime environment for API routes
- Environment variables are encrypted and only accessible to your functions

## Troubleshooting

### Build Failures
- Check that all environment variables are set in Vercel
- Verify Next.js configuration is correct
- Ensure all dependencies are properly installed

### Deployment Issues
- Check Vercel deployment logs in the dashboard
- Verify GitHub integration is working
- Review function logs for API route issues

### API Key Issues
- Ensure OpenAI API key is valid and has sufficient credits
- Check that the key has TTS permissions
- Verify the key is correctly set in Vercel environment variables
