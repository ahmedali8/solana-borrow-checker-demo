# See https://just.systems/man/en/settings.html
set shell := ["bash", "-euo", "pipefail", "-c"]

export RUST_LOG := env("RUST_LOG", "off")

# Default recipe - show available commands
default:
    just --list

# Clean build artifacts
clean +globs=".anchor .surfpool target idls/types":
    rm -rf {{ globs }}

# Setup development environment with specific versions
[group("setup")]
setup:
    @./scripts/bash/setup.sh

# Show all installed development tool versions
[group("setup")]
versions:
    @./scripts/bash/show-versions.sh
alias v := versions

# ---------------------------------------------------------------------------- #
#                                    TESTING                                   #
# ---------------------------------------------------------------------------- #

# Run all tests
# To debug the Solana logs, run this as `RUST_LOG=debug just test`
[group("test")]
test: test-litesvm

# Run litesvm tests (optionally specify a test file, e.g., 'just test-litesvm counter' or 'just test-litesvm counter --test-name-pattern "count"')
[group("test")]
test-litesvm file="" *args="":
    @anchor build
    @bun test {{ if file == "" { "" } else { "tests/" + file + ".test.ts" } }} {{ args }}

# ---------------------------------------------------------------------------- #
#                                 INSTRUCTIONS                                 #
# ---------------------------------------------------------------------------- #

# Initialize counter
[group("instructions")]
init +args="":
    bun run scripts/instructions/init.ts {{ args }}

# Increment counter
[group("instructions")]
increment +args="":
    bun run scripts/instructions/increment.ts {{ args }}

# Decrement counter
[group("instructions")]
decrement +args="":
    bun run scripts/instructions/decrement.ts {{ args }}

# ---------------------------------------------------------------------------- #
#                                     VIEW                                     #
# ---------------------------------------------------------------------------- #

# View counter count
[group("view")]
view-count +args="":
    bun run scripts/view/count.ts {{ args }}

# ---------------------------------------------------------------------------- #
#                                  CODE CHECKS                                 #
# ---------------------------------------------------------------------------- #

# Run all code checks
[group("checks")]
full-check: biome-check tsc-check rust-check
alias fc := full-check

# Run all code fixes
[group("checks")]
full-write: biome-write rust-write
alias fw := full-write

# Check code with Biome
[group("checks")]
biome-check +globs=".":
    bun run biome check {{ globs }}
alias bc := biome-check

# Fix code with Biome
# The `noUnusedImports` rule is disabled by default to allow unused imports during development
[group("checks")]
biome-write +globs=".":
    bun run biome check --write {{ globs }}
    bun run biome lint --unsafe --write --only correctness/noUnusedImports {{ globs }}
alias bw := biome-write

# Type check with TypeScript
[group("checks")]
@tsc-check project="tsconfig.json":
    bun run tsc --noEmit --project {{ project }}

# Run Rust checks
[group("checks")]
rust-check:
    cargo fmt --check
    cargo clippy -- --deny warnings
alias rc := rust-check

# Format Rust code
[group("checks")]
rust-write:
    cargo fmt
    cargo clippy --fix --allow-dirty
alias rw := rust-write
