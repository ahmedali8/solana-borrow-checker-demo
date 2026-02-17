use anchor_lang::prelude::*;

#[error_code]
pub enum CounterError {
    #[msg("Counter overflow: cannot increment beyond u64::MAX")]
    Overflow,
    #[msg("Counter underflow: cannot decrement below zero")]
    Underflow,
}
