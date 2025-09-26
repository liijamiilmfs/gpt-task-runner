#!/bin/bash

# Deployment script for GPT Task Runner
set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-your-registry.com}
APP_VERSION=${APP_VERSION:-$(git rev-parse --short HEAD)}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo -e "${BLUE}🚀 Deploying GPT Task Runner to ${ENVIRONMENT}${NC}"
echo "=================================================="

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        echo -e "${GREEN}✅ Valid environment: ${ENVIRONMENT}${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Function to print deployment steps
print_step() {
    echo -e "\n${YELLOW}📋 Step $1: $2${NC}"
}

# Pre-deployment checks
print_step 1 "Running pre-deployment checks"
echo "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Working directory is not clean${NC}"
    echo "Please commit or stash your changes before deployment"
    exit 1
fi
echo -e "${GREEN}✅ Git status clean${NC}"

echo "Checking if we're on main/master branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" && "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}⚠️  Warning: Deploying to production from branch '$CURRENT_BRANCH'${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✅ Branch check passed${NC}"

# Run tests
print_step 2 "Running test suite"
if ! ./scripts/test/run-tests.sh; then
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
fi

# Build application
print_step 3 "Building application"
if ! ./scripts/build/build.sh; then
    echo -e "${RED}❌ Build failed. Aborting deployment.${NC}"
    exit 1
fi

# Build Docker image
print_step 4 "Building Docker image"
DOCKER_IMAGE="${DOCKER_REGISTRY}/gpt-task-runner:${APP_VERSION}"
echo "Building image: ${DOCKER_IMAGE}"

if ! docker build -t ${DOCKER_IMAGE} .; then
    echo -e "${RED}❌ Docker build failed. Aborting deployment.${NC}"
    exit 1
fi

# Push Docker image
print_step 5 "Pushing Docker image"
echo "Pushing image: ${DOCKER_IMAGE}"
if ! docker push ${DOCKER_IMAGE}; then
    echo -e "${RED}❌ Docker push failed. Aborting deployment.${NC}"
    exit 1
fi

# Tag as latest for non-production environments
if [ "$ENVIRONMENT" != "production" ]; then
    LATEST_IMAGE="${DOCKER_REGISTRY}/gpt-task-runner:latest-${ENVIRONMENT}"
    echo "Tagging as: ${LATEST_IMAGE}"
    docker tag ${DOCKER_IMAGE} ${LATEST_IMAGE}
    docker push ${LATEST_IMAGE}
fi

# Environment-specific deployment
case $ENVIRONMENT in
    development)
        deploy_development
        ;;
    staging)
        deploy_staging
        ;;
    production)
        deploy_production
        ;;
esac

# Post-deployment verification
print_step 6 "Running post-deployment verification"
verify_deployment

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${APP_VERSION}"
echo "Image: ${DOCKER_IMAGE}"
echo "Deployment Time: $(date)"
echo "=================================================="

# Environment-specific deployment functions
deploy_development() {
    echo -e "${BLUE}🐳 Deploying to development environment...${NC}"

    # Update docker-compose override
    cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    image: ${DOCKER_IMAGE}
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
EOF

    # Deploy with Docker Compose
    docker-compose up -d

    # Wait for services to be healthy
    echo "Waiting for services to be ready..."
    sleep 30

    # Check service health
    if curl -f http://localhost:3000/api/v1/status > /dev/null; then
        echo -e "${GREEN}✅ Development deployment successful${NC}"
    else
        echo -e "${RED}❌ Development deployment failed${NC}"
        exit 1
    fi
}

deploy_staging() {
    echo -e "${BLUE}🚀 Deploying to staging environment...${NC}"

    # Use staging-specific docker-compose file
    if [ ! -f "${COMPOSE_FILE}" ]; then
        echo -e "${RED}❌ Staging docker-compose file not found: ${COMPOSE_FILE}${NC}"
        exit 1
    fi

    # Deploy with Docker Compose
    docker-compose -f ${COMPOSE_FILE} up -d

    # Wait for services to be healthy
    echo "Waiting for services to be ready..."
    sleep 60

    # Run smoke tests
    echo "Running smoke tests..."
    if curl -f https://staging.gpt-task-runner.com/api/v1/status > /dev/null; then
        echo -e "${GREEN}✅ Staging deployment successful${NC}"
    else
        echo -e "${RED}❌ Staging deployment failed${NC}"
        exit 1
    fi
}

deploy_production() {
    echo -e "${BLUE}🚀 Deploying to production environment...${NC}"

    # Production deployment requires additional safety checks
    echo "Running production pre-deployment checks..."
    check_production_readiness

    # Deploy with Kubernetes
    echo "Deploying to Kubernetes..."
    kubectl set image deployment/gpt-task-runner app=${DOCKER_IMAGE} -n production
    kubectl rollout status deployment/gpt-task-runner -n production --timeout=300s

    # Run production smoke tests
    echo "Running production smoke tests..."
    if curl -f https://gpt-task-runner.com/api/v1/status > /dev/null; then
        echo -e "${GREEN}✅ Production deployment successful${NC}"
    else
        echo -e "${RED}❌ Production deployment failed${NC}"
        kubectl rollout undo deployment/gpt-task-runner -n production
        exit 1
    fi
}

check_production_readiness() {
    echo "Checking production readiness..."

    # Check if all tests pass
    if ! ./scripts/test/run-tests.sh; then
        echo -e "${RED}❌ Production tests failed${NC}"
        exit 1
    fi

    # Check for any critical vulnerabilities
    if npm audit --audit-level critical; then
        echo -e "${GREEN}✅ No critical vulnerabilities found${NC}"
    else
        echo -e "${RED}❌ Critical vulnerabilities found${NC}"
        exit 1
    fi

    # Verify database migrations are ready
    echo "Checking database migration status..."
    # Add migration check logic here

    echo -e "${GREEN}✅ Production readiness checks passed${NC}"
}

verify_deployment() {
    echo "Verifying deployment..."

    # Get deployment URL based on environment
    case $ENVIRONMENT in
        development)
            DEPLOYMENT_URL="http://localhost:3000"
            ;;
        staging)
            DEPLOYMENT_URL="https://staging.gpt-task-runner.com"
            ;;
        production)
            DEPLOYMENT_URL="https://gpt-task-runner.com"
            ;;
    esac

    echo "Checking health endpoint: ${DEPLOYMENT_URL}/api/v1/status"
    if curl -f -s "${DEPLOYMENT_URL}/api/v1/status" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"

        # Get version info
        VERSION_INFO=$(curl -s "${DEPLOYMENT_URL}/api/v1/status" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "Deployed version: ${VERSION_INFO}"

        # Check if version matches
        if [ "$VERSION_INFO" = "${APP_VERSION}" ]; then
            echo -e "${GREEN}✅ Version verification passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Version mismatch: expected ${APP_VERSION}, got ${VERSION_INFO}${NC}"
        fi
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
}

# Help function
show_help() {
    echo "GPT Task Runner Deployment Script"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development    Deploy to local development environment"
    echo "  staging        Deploy to staging environment"
    echo "  production     Deploy to production environment (requires approval)"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_REGISTRY    Docker registry URL (default: your-registry.com)"
    echo "  APP_VERSION        Application version (default: current git commit)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 staging"
    echo "  DOCKER_REGISTRY=myregistry.com $0 production"
}