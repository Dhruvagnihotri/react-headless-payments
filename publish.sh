#!/bin/bash

# Publish script for @headlesskits/react-headless-payments
# Bumps minor version and publishes to npm
# Usage: NPM_TOKEN=your_token ./publish.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Publishing @headlesskits/react-headless-payments${NC}"

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
  echo -e "${RED}❌ Error: NPM_TOKEN environment variable is not set${NC}"
  echo "Usage: NPM_TOKEN=your_token ./publish.sh"
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ Error: npm is not installed${NC}"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📦 Current version: ${CURRENT_VERSION}${NC}"

# Bump minor version
echo -e "${YELLOW}📝 Bumping minor version...${NC}"
npm version minor --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ New version: ${NEW_VERSION}${NC}"

# Build the package
echo -e "${YELLOW}🔨 Building package...${NC}"
npm run build

# Create .npmrc with token
echo -e "${YELLOW}🔐 Setting up npm authentication...${NC}"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Publish to npm
echo -e "${YELLOW}📤 Publishing to npm...${NC}"
npm publish --access public

# Clean up .npmrc
rm -f .npmrc

echo -e "${GREEN}✅ Successfully published v${NEW_VERSION}!${NC}"
echo -e "${YELLOW}📚 Package: https://www.npmjs.com/package/@headlesskits/react-headless-payments${NC}"
