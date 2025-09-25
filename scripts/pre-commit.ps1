# Pre-commit script to run linting, type checking, and tests
# Usage: .\scripts\pre-commit.ps1

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

# Run linting
Write-Host "📝 Running ESLint..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint failed. Please fix the issues before committing." -ForegroundColor Red
    exit 1
}

# Run Prettier check
Write-Host "🎨 Running Prettier check..." -ForegroundColor Yellow
npm run format:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prettier check failed. Please run 'npm run format' to fix formatting issues." -ForegroundColor Red
    exit 1
}

# Run type checking
Write-Host "🔧 Running TypeScript type check..." -ForegroundColor Yellow
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript type check failed. Please fix the type errors before committing." -ForegroundColor Red
    exit 1
}

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed. Please fix the failing tests before committing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All pre-commit checks passed!" -ForegroundColor Green
Write-Host "🚀 Ready to commit!" -ForegroundColor Green
exit 0
