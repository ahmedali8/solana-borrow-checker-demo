#!/usr/bin/env bash
# =============================================================================
# Development Environment Setup Script
# =============================================================================
# This script sets up a complete Solana development environment with specific
# versions of Rust, Solana CLI, and Anchor framework.
#
# Usage: ./scripts/bash/setup.sh
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration Constants
# =============================================================================
readonly RUST_VERSION="1.89.0"
readonly SOLANA_CLI_VERSION="2.3.13"
readonly ANCHOR_VERSION="0.32.1"
readonly AVM_VERSION="0.32.1"
readonly BUN_VERSION="1.3.1"
readonly NODE_VERSION="v24.10.0"
readonly SURFPOOL_VERSION="1.0.0"

# Colors for output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

# Print colored output
print_status()   { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success()  { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning()  { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()    { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if a command exists
command_exists() { command -v "$1" &>/dev/null; }

# Get the current shell profile file (do not source it in this script)
get_shell_profile() {
  local current_shell
  current_shell="$(echo "${SHELL:-}")"

  if [[ "$current_shell" == *"zsh"* ]]; then
    echo "$HOME/.zshrc"
  elif [[ "$current_shell" == *"bash"* ]]; then
    # Prefer .bashrc; if missing, fall back to .bash_profile
    if [[ -f "$HOME/.bashrc" ]]; then
      echo "$HOME/.bashrc"
    else
      echo "$HOME/.bash_profile"
    fi
  else
    # Default to POSIX profile if shell unknown
    echo "$HOME/.profile"
  fi
}

append_line_once() {
  # Append a line to a file if it's not already present
  local line="$1"
  local file="$2"

  # Ensure file exists
  [[ -f "$file" ]] || touch "$file"

  if ! grep -Fq "$line" "$file" 2>/dev/null; then
    printf '%s\n' "$line" >> "$file"
  else
    print_warning "Entry already exists in $file: $line"
  fi
}

# =============================================================================
# Rust Setup
# =============================================================================

setup_rust() {
  print_status "Setting up Rust version $RUST_VERSION..."

  # Check if rustup is installed, install if not
  if ! command_exists rustup; then
    print_status "rustup not found, installing rustup..."

    # Install rustup using the official installer
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

    # Source cargo environment to make rustup available
    source "$HOME/.cargo/env"

    print_success "rustup installed successfully"
  else
    print_success "rustup is already installed"
  fi

  # Set the Rust version
  print_status "Setting Rust version to $RUST_VERSION..."
  rustup toolchain install "$RUST_VERSION" >/dev/null 2>&1 || true
  rustup default "$RUST_VERSION"
  print_success "Rust version set to $RUST_VERSION"
}

# =============================================================================
# Solana CLI Setup
# =============================================================================

# Install Solana CLI with proper PATH configuration
install_solana_cli() {
  print_status "Installing Solana CLI version $SOLANA_CLI_VERSION..."

  # Download and install Solana CLI
  sh -c "$(curl -sSfL https://release.anza.xyz/v$SOLANA_CLI_VERSION/install)"

  # Add Solana CLI to PATH for current session
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

  # Add to shell profile for persistent PATH
  local shell_profile
  shell_profile=$(get_shell_profile)
  append_line_once 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' "$shell_profile"

  print_success "Solana CLI installed successfully"
}

setup_solana() {
  print_status "Setting up Solana CLI..."

  # Check if Solana CLI is already installed
  if command_exists solana; then
    # Get current version
    local current_version
    current_version="$(solana --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"

    if [ "$current_version" = "$SOLANA_CLI_VERSION" ]; then
      print_success "Solana CLI version $SOLANA_CLI_VERSION is already installed"
    else
      print_warning "Solana CLI version $current_version found, installing $SOLANA_CLI_VERSION"
      install_solana_cli
    fi
  else
    print_status "Solana CLI not found, installing..."
    install_solana_cli
  fi

  # Verify installation
  print_status "Verifying Solana CLI installation..."
  solana --version
}

# =============================================================================
# Bun Setup
# =============================================================================

setup_bun() {
  print_status "Setting up Bun..."

  local bun_bin="$HOME/.bun/bin/bun"

  if command_exists bun; then
    local current_bun
    current_bun="$(bun --version || true)"
    if [[ "$current_bun" == "$BUN_VERSION" ]]; then
      print_success "Bun $BUN_VERSION is already installed"
    else
      print_warning "Bun $current_bun found; upgrading to $BUN_VERSION"
      # Use the official installer to upgrade to specific version
      curl -fsSL https://bun.com/install | bash -s "bun-v$BUN_VERSION"
    fi
  else
    print_status "Bun not found, installing..."

    # Official installer
    curl -fsSL https://bun.com/install | bash -s "bun-v$BUN_VERSION"
  fi

  # Ensure PATH for current session
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"

  # Persist PATH for future sessions
  local shell_profile
  shell_profile="$(get_shell_profile)"
  append_line_once 'export BUN_INSTALL="$HOME/.bun"' "$shell_profile"
  append_line_once 'export PATH="$BUN_INSTALL/bin:$PATH"' "$shell_profile"

  print_status "Verifying Bun installation..."
  bun --version
  print_success "Bun setup complete"
}

# =============================================================================
# Surfpool Setup
# =============================================================================

setup_surfpool() {
  print_status "Setting up Surfpool..."

  # Check if we're on macOS
  if [[ "$(uname)" != "Darwin" ]]; then
    print_warning "Surfpool is only supported on macOS. Skipping installation."
    return 0
  fi

  print_status "Installing Surfpool..."

  # Download and install Surfpool
  curl -L -o surfpool.tar.gz \
    "$(curl -s https://api.github.com/repos/txtx/surfpool/releases/tags/v$SURFPOOL_VERSION \
      | grep browser_download_url | grep darwin | grep arm64 | cut -d '"' -f 4)"
  tar -xzf surfpool.tar.gz
  chmod +x surfpool
  mv surfpool /opt/homebrew/bin/surfpool
  rm -f surfpool.tar.gz

  print_success "Surfpool installed successfully"
  surfpool --version
}

# =============================================================================
# Anchor Framework Setup
# =============================================================================

setup_anchor() {
  print_status "Setting up Anchor framework..."

  # Ensure cargo is in PATH (rustup installed earlier)
  export PATH="$HOME/.cargo/bin:$PATH"

  if command_exists avm; then
    local current_avm_version
    current_avm_version="$(avm --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"
    if [[ "$current_avm_version" == "$AVM_VERSION" ]]; then
      print_success "AVM $AVM_VERSION is already installed"
    else
      print_warning "AVM $current_avm_version found, installing $AVM_VERSION"
      cargo install --git https://github.com/solana-foundation/anchor avm --force
      print_success "AVM installed"
    fi
  else
    print_status "AVM not found, installing AVM (Anchor Version Manager)..."
    cargo install --git https://github.com/solana-foundation/anchor avm --force
    print_success "AVM installed"
  fi

  print_status "Installing Anchor version $ANCHOR_VERSION via avm..."
  avm install "$ANCHOR_VERSION"
  avm use "$ANCHOR_VERSION"

  print_status "Verifying Anchor..."
  avm --version
  anchor --version
  print_success "Anchor framework setup complete"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
  print_status "Starting development environment setup..."
  print_status "Detected shell: $SHELL"
  echo

  # Setup each component
  setup_rust
  echo

  setup_solana
  echo

  setup_bun
  echo

  setup_surfpool
  echo

  setup_anchor
  echo

  # Copy .env.example to .env without clobbering
  if [[ -f .env ]]; then
    print_warning ".env already exists; leaving it unchanged"
  elif [[ -f .env.example ]]; then
    cp .env.example .env
    echo "Copied .env.example to .env"
  else
    print_warning "No .env.example found; skipping"
  fi
  echo

  # Display final versions
  print_status "Development Environment Versions:"
  echo "========================================"
  echo "Shell: $SHELL"
  echo "Rust: $(rustc --version)"
  echo "Solana CLI: $(solana --version)"
  echo "Bun: $(bun --version)"
  echo "Node.js: $(node --version)"
  echo "npm: $(npm --version)"
  echo "AVM: $(avm --version)"
  echo "Anchor CLI: $(anchor --version)"
  if command_exists surfpool; then
    echo "Surfpool: $(surfpool --version)"
  else
    echo "Surfpool: Not installed (macOS only, visit https://docs.surfpool.run/install)"
  fi
  echo "========================================"
  print_success "Setup complete! All tools are ready to use."
}

# Run main function
main "$@"
