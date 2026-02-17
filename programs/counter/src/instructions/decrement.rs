use crate::utils::{constants::seeds, errors::CounterError, events::CounterUpdated, state::Counter};
use anchor_lang::prelude::*;

pub fn handler(ctx: Context<DecrementAccounts>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = counter.count.checked_sub(1).ok_or(CounterError::Underflow)?;

    emit!(CounterUpdated { counter: counter.key(), caller: ctx.accounts.payer.key(), count: counter.count });

    Ok(())
}

#[derive(Accounts)]
pub struct DecrementAccounts<'info> {
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [seeds::COUNTER],
        bump,
    )]
    pub counter: Account<'info, Counter>,
}
