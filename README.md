# Solana Borrow Checker Demo

## Prerequisites

- Install [just](https://github.com/casey/just)
- Install [nvm](https://github.com/nvm-sh/nvm)

## Quick Start

1. **Set up Node.js** (if not already done):

   ```bash
   $ nvm use
   # If version not installed:
   $ nvm install
   ```

2. **Install development tools**:

   This will automatically install and configure:

   - **Bun**: v1.3.1
   - **Rust**: v1.89.0
   - **Solana CLI**: v2.3.13  
   - **Anchor CLI**: v0.32.1 (via AVM v0.32.1)
   - **Surfpool**: 1.0.0

   ```bash
   # Install all versions
   $ just setup

   # Source your shell profile
   $ source ~/.zshrc  # if you're using zsh shell
   # source ~/.bashrc # if you're using bash shell

   # Install deps
   $ bun install
   ```

3. **Run tests**:

   ```bash
   just test
   ```

## Available Commands

Run `just` to get all available commands.

## Surfnet - Deploy and use program locally

```bash
# build vault program using local env
cp .env.example .env
just build

# start surfnet (in another terminal)
surfpool start

# initialize the program
just init

# increment the count
just increment

# view the count
just view-count

# decrement the count
just decrement
```
