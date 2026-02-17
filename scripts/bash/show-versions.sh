#!/usr/bin/env bash
# =============================================================================
# Development Environment Version Display Script
# =============================================================================
# This script displays all installed development tools and their versions
#
# Usage: ./scripts/bash/show-versions.sh
# =============================================================================

set -euo pipefail

# Colors for output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Print colored output
print_status()   { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success()  { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning()  { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()    { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if a command exists
command_exists() { command -v "$1" &>/dev/null; }

# Get OS version
get_os_version() {
  if command -v lsb_release &> /dev/null; then
    echo "$(lsb_release -d | cut -f2)"
  elif [[ "$(uname)" == "Darwin" ]]; then
    echo "macOS $(sw_vers -productVersion)"
  elif [[ "$(uname)" == "Linux" ]]; then
    if [[ -f /etc/os-release ]]; then
      echo "$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)"
    else
      echo "Linux $(uname -r)"
    fi
  else
    echo "$(uname -s) $(uname -r)"
  fi
}

# Get shell information
get_shell_info() {
  echo "$SHELL ($(basename "$SHELL"))"
}

# Display versions
main() {
  print_status "Development Environment Versions:"
  echo "========================================"

  # OS Information
  echo -e "OS: \n  $(get_os_version)"
  echo

  # Shell Information
  echo -e "Shell: \n  $(get_shell_info)"
  echo

  # Rust
  if command_exists rustc; then
    echo -e "Rust: \n  $(rustc -V)"
  else
    echo -e "Rust: \n  ${RED}Not installed${NC}"
  fi
  echo

  # Solana CLI
  if command_exists solana; then
    echo -e "Solana CLI: \n  $(solana -V)"
  else
    echo -e "Solana CLI: \n  ${RED}Not installed${NC}"
  fi
  echo

  # Anchor
  if command_exists anchor; then
    echo -e "Anchor: \n  $(anchor --version)"
  else
    echo -e "Anchor: \n  ${RED}Not installed${NC}"
  fi
  echo

  # AVM
  if command_exists avm; then
    echo -e "AVM: \n  $(avm --version)"
  else
    echo -e "AVM: \n  ${RED}Not installed${NC}"
  fi
  echo

  # Bun
  if command_exists bun; then
    echo -e "Bun: \n  $(bun --version)"
  else
    echo -e "Bun: \n  ${RED}Not installed${NC}"
  fi
  echo

  # Node.js
  if command_exists node; then
    echo -e "Node.js: \n  $(node --version)"
  else
    echo -e "Node.js: \n  ${RED}Not installed${NC}"
  fi
  echo

  # npm
  if command_exists npm; then
    echo -e "npm: \n  $(npm --version)"
  else
    echo -e "npm: \n  ${RED}Not installed${NC}"
  fi
  echo

  # Surfpool (macOS only)
  if command_exists surfpool; then
    echo -e "Surfpool: \n  $(surfpool --version)"
  else
    if [[ "$(uname)" == "Darwin" ]]; then
      echo -e "Surfpool: \n  ${YELLOW}Not installed (macOS only, visit https://docs.surfpool.run/install)${NC}"
    else
      echo -e "Surfpool: \n  ${YELLOW}Not available (macOS only)${NC}"
    fi
  fi
  echo

  # build-sbf
  if command_exists cargo && cargo build-sbf --version &>/dev/null; then
    echo -e "build-sbf: \n  $(cargo build-sbf --version | head -n 1)"
  else
    echo -e "build-sbf: \n  ${RED}Not available${NC}"
  fi
  echo

  echo "========================================"

  # PATH Information
  print_status "PATH Environment:"
  echo "========================================"
  echo "$PATH" | tr ':' '\n' | sort | sed 's/^/  /'
  echo "========================================"

  print_success "Version check complete!"
}

# Run main function
main "$@"
