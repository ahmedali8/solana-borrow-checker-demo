use anchor_lang::prelude::*;

#[event]
pub struct CounterInitialized {
    pub counter: Pubkey,
    pub caller: Pubkey,
}

#[event]
pub struct CounterUpdated {
    pub counter: Pubkey,
    pub caller: Pubkey,
    pub count: u64,
}
