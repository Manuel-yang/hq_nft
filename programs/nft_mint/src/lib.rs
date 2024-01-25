use anchor_lang::prelude::*;
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("CUdrh7HLaAkNvcaDZhtmkCBxe3GjqW7ELEK9s13SJQ5y");

#[program]
pub mod nft_mint {
    use self::instructions::MintNft;

    use super::*;

    pub fn mint(ctx: Context<MintNft>) -> Result<()> {
        let _ = instructions::mint(ctx);
        Ok(())
    }

    pub fn init_program_pda(ctx: Context<InitAdminPda>, admin: Pubkey) -> Result<()> {
        let _ = instructions::init_admin_pda(ctx, admin);
        Ok(())
    }
}
