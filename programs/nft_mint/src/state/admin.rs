use anchor_lang::prelude::*;

#[account]
pub struct AdminPda {
    // control add/minus mint/compound times
    pub admin: Pubkey,
    pub program_pda_bump: u8,
}

impl AdminPda {
    pub fn init(admin: Pubkey, program_pda_bump: u8) -> Self {
        Self {
            admin: admin,
            program_pda_bump: program_pda_bump,
        }
    }
}
