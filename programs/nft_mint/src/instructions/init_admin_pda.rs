use crate::error::ErrorCode;
use crate::state::AdminPda;
use anchor_lang::prelude::*;

pub fn init_admin_pda(ctx: Context<InitAdminPda>, admin: Pubkey) -> Result<()> {
    let admin = admin;
    let program_pda = &mut ctx.accounts.admin_pda;

    let program_pda_bump = *ctx
      .bumps
      .get("program_admin_pda")
      .ok_or(ErrorCode::StakeBumpError)?;

    **program_pda = AdminPda::init(admin, program_pda_bump);

    Ok(())
}

#[derive(Accounts)]
pub struct InitAdminPda<'info> {
  #[account(mut)]
  payer: Signer<'info>,

  #[account(
    init,
    payer = payer,
    space = 64,
    seeds = [
        b"program_admin_pda",
    ],
    bump
  )]
  pub admin_pda: Account<'info, AdminPda>,
  pub system_program: Program<'info, System>,
}
