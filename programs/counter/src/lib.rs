use anchor_lang::prelude::*;

mod instructions;
mod utils;

use instructions::*;

declare_id!("AtoUtAszTsCzvdm54bKsc28PpYnNaA2pg7zYkyXPtiCw");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<InitializeAccounts>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn increment(ctx: Context<IncrementAccounts>) -> Result<()> {
        instructions::increment::handler(ctx)
    }

    pub fn decrement(ctx: Context<DecrementAccounts>) -> Result<()> {
        instructions::decrement::handler(ctx)
    }
}
