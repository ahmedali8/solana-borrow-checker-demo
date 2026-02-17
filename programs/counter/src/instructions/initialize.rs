use crate::utils::{
    constants::{seeds, ANCHOR_DISCRIMINATOR},
    events::CounterInitialized,
    state::Counter,
};
use anchor_lang::prelude::*;

pub fn handler(ctx: Context<InitializeAccounts>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.count = 0;

    emit!(CounterInitialized { counter: ctx.accounts.counter.key(), caller: ctx.accounts.payer.key() });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR + Counter::INIT_SPACE,
        seeds = [seeds::COUNTER],
        bump,
    )]
    pub counter: Account<'info, Counter>,

    pub system_program: Program<'info, System>,
}
