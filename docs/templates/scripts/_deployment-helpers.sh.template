#!/bin/bash
# Deployment configuration helper functions
# Reads from .deployment-config.json at project root

# Get the project root directory
get_project_root() {
  git rev-parse --show-toplevel 2>/dev/null
}

# Load deployment configuration
load_deployment_config() {
  local project_root=$(get_project_root)
  local config_file="$project_root/.deployment-config.json"

  if [[ ! -f "$config_file" ]]; then
    echo "❌ ERROR: .deployment-config.json not found in project root"
    echo "Expected: $config_file"
    exit 1
  fi

  # Verify jq is installed
  if ! command -v jq &> /dev/null; then
    echo "❌ ERROR: jq is required but not installed"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
  fi

  # Validate JSON syntax
  if ! jq empty "$config_file" 2>/dev/null; then
    echo "❌ ERROR: Invalid JSON in .deployment-config.json"
    echo "File: $config_file"
    echo "Fix JSON syntax errors before continuing"
    exit 1
  fi

  cat "$config_file"
}

# Get configuration value
get_config() {
  local key="$1"
  load_deployment_config | jq -r "$key"
}

# Validate required tools
validate_prerequisites() {
  local missing=()

  # Check git
  if ! command -v git &> /dev/null; then
    missing+=("git")
  fi

  # Check node
  if ! command -v node &> /dev/null; then
    missing+=("node")
  fi

  # Check npm
  if ! command -v npm &> /dev/null; then
    missing+=("npm")
  fi

  # Check gh (GitHub CLI)
  if ! command -v gh &> /dev/null; then
    missing+=("gh (GitHub CLI)")
  fi

  # Check jq
  if ! command -v jq &> /dev/null; then
    missing+=("jq")
  fi

  # Check curl (needed for health checks)
  if ! command -v curl &> /dev/null; then
    missing+=("curl")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required tools:"
    for tool in "${missing[@]}"; do
      echo "  - $tool"
    done
    echo ""
    echo "Install missing tools before continuing."
    exit 1
  fi
}

# Check GitHub CLI authentication
check_gh_auth() {
  if ! gh auth status &> /dev/null; then
    echo "❌ ERROR: GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
  fi
}

# Export configuration variables
export_config_vars() {
  export PROJECT_NAME=$(get_config '.projectName')
  export GITHUB_OWNER=$(get_config '.github.owner')
  export GITHUB_REPO=$(get_config '.github.repo')
  export VERCEL_PROJECT_NAME=$(get_config '.vercel.projectName')
  export PREVIEW_URL=$(get_config '.vercel.previewUrl')
  export PRODUCTION_URL=$(get_config '.vercel.productionUrl')
  export PREVIEW_BRANCH=$(get_config '.environments.preview.branch')
  export PRODUCTION_BRANCH=$(get_config '.environments.production.branch')
}
