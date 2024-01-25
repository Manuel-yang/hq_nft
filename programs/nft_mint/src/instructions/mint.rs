use anchor_lang::prelude::*;
use anchor_lang::system_program;
use mpl_candy_guard::state::CandyGuard;
use mpl_candy_machine_core::CandyMachine;
use anchor_spl::token::Token;
use anchor_spl::associated_token::AssociatedToken;
use solana_program::sysvar;
use mpl_candy_guard::cpi::accounts::MintV2;
use anchor_spl::token;
use anchor_spl::associated_token;
use crate::AdminPda;
use crate::error::ErrorCode;

pub fn mint(ctx: Context<MintNft>) -> Result<()> {
    require!(ctx.accounts.admin.is_signer && ctx.accounts.admin.key() == ctx.accounts.program_admin_pda.admin.key() , ErrorCode::InvalidCall);
    let _ = cpi_mint(ctx);
    Ok(())
}

pub fn cpi_mint<'info>(ctx: Context<MintNft>) -> Result<()> {
  system_program::create_account(
    // create account
    CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        system_program::CreateAccount {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.minter_authority.to_account_info(),
        },
    ),
    ctx.accounts.rent.minimum_balance(82), //lamports: u64
    82,       //space: u64 for size
    &ctx.accounts.token_program.key(),
  )?;

  token::initialize_mint(
    // init mint account
    CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::InitializeMint {
            mint: ctx.accounts.minter_authority.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    ),
    0, //zero decimals for the mint
    &ctx.accounts.payer.key(),
    Some(&ctx.accounts.payer.key()),
)?;

associated_token::create(
  // init ata account
  CpiContext::new(
      ctx.accounts.associated_token_program.to_account_info(),
      associated_token::Create {
          payer: ctx.accounts.payer.to_account_info(),
          associated_token: ctx.accounts.token_account.to_account_info(),
          authority: ctx.accounts.payer.to_account_info(),
          mint: ctx.accounts.minter_authority.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
          token_program: ctx.accounts.token_program.to_account_info(),
      },
  ),
)?;

token::mint_to(
  //mint nft to token_account
  CpiContext::new(
    ctx.accounts.associated_token_program.to_account_info(),
    token::MintTo {
        mint: ctx.accounts.minter_authority.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    },
  ),
  1,
)?;

let program_admin_pda = &ctx.accounts.program_admin_pda;
let AdminPda {
  program_pda_bump, ..
} =  **program_admin_pda;

let program_pda_seed = &[
  &b"program_admin_pda"[..],
  &[program_pda_bump],
];

let binding = &[&program_pda_seed[..]];
let cpi = ctx.accounts.cpi_invoke().with_signer(binding);

mpl_candy_guard::cpi::mint_v2(cpi, vec![0], Some("HQNFTT".to_string()))?;

Ok(())
}


#[derive(Accounts)]
pub struct MintNft<'info> {
  // pda which can pass candy guard when invoking candy machine
  #[account(
      mut,
      seeds = [
          b"program_admin_pda",
      ],
      bump
  )]
  pub program_admin_pda: Account<'info, AdminPda>,

  #[account(mut)]
  pub admin: Signer<'info>,


  // address = Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g
  /// CHECK: account constraints checked in account trait
  #[account(address = mpl_candy_guard::id())]
  pub candy_guard_program: AccountInfo<'info>,

  // address = CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR
  /// CHECK: account constraints checked in account trait
  #[account(address = mpl_candy_machine_core::id())]
  pub candy_machine_program: AccountInfo<'info>,

  // candy guard address after deploying candy machine
  #[account(mut)]
  pub candy_guard: Box<Account<'info, CandyGuard>>,

  // candy machine address after deploying candy machine
  /// Candy machine account.
  #[account(mut, constraint = candy_guard.key() == candy_machine.mint_authority)]
  pub candy_machine: Box<Account<'info, CandyMachine>>,

  /// Candy Machine authority account.
  ///
  /// CHECK: account constraints checked in CPI
  #[account(mut)]
  pub candy_machine_authority_pda: UncheckedAccount<'info>, // candy_machine_authority_pda

  /// Payer for the mint (SOL) fees.
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(mut)]
  pub minter_authority: Signer<'info>,

  /// Mint account of the NFT. The account will be initialized if necessary.
  ///
  /// Must be a signer if:
  ///   * the nft_mint account does not exist.
  ///
  /// CHECK: account checked in CPI
  #[account(mut)]
  pub nft_mint: UncheckedAccount<'info>,

  /// Mint authority of the NFT before the authority gets transfer to the master edition account.
  ///
  /// If nft_mint account exists:
  ///   * it must match the mint authority of nft_mint.
  #[account(mut)]
  pub nft_mint_authority: Signer<'info>,

  /// Metadata account of the NFT. This account must be uninitialized.
  ///
  /// CHECK: account checked in CPI
  #[account(mut)]
  pub nft_metadata: UncheckedAccount<'info>,

  /// Master edition account of the NFT. The account will be initialized if necessary.
  ///
  /// CHECK: account checked in CPI
  #[account(mut)]
  pub nft_master_edition: UncheckedAccount<'info>,

  /// CHECK: doc comment explaining why no checks through types are necessary.
  #[account(mut)]
  pub token_account: UncheckedAccount<'info>,

  /// Collection authority or metadata delegate record.
  ///
  /// CHECK: account checked in CPI
  pub collection_delegate_record: UncheckedAccount<'info>,

  /// Mint account of the collection NFT.
  ///
  /// CHECK: account checked in CPI
  pub collection_mint: UncheckedAccount<'info>,

  /// Metadata account of the collection NFT.
  ///
  /// CHECK: account checked in CPI
  #[account(mut)]
  pub collection_metadata: UncheckedAccount<'info>,

  /// Master edition account of the collection NFT.
  ///
  /// CHECK: account checked in CPI
  pub collection_master_edition: UncheckedAccount<'info>,

  /// Update authority of the collection NFT.
  ///
  /// CHECK: account checked in CPI
  #[account(mut)]
  pub collection_update_authority: UncheckedAccount<'info>,

  /// Token Metadata program.
  ///
  /// CHECK: account checked in CPI
  #[account(address = mpl_token_metadata::id())]
  pub token_metadata_program: UncheckedAccount<'info>,

  /// SPL Token program.
  pub token_program: Program<'info, Token>,

  /// SPL Associated Token program.
  pub associated_token_program: Program<'info, AssociatedToken>,

  /// System program.
  pub system_program: Program<'info, System>,

  /// Instructions sysvar account.
  ///
  /// CHECK: account constraints checked in account trait
  #[account(address = sysvar::instructions::id())]
  pub sysvar_instructions: UncheckedAccount<'info>,

  /// SlotHashes sysvar cluster data.
  ///
  /// CHECK: account constraints checked in account trait
  #[account(address = sysvar::slot_hashes::id())]
  pub recent_slothashes: UncheckedAccount<'info>,
  pub rent: Sysvar<'info, Rent>,
}

impl<'info> MintNft<'info> {
  pub fn cpi_invoke(&self) -> CpiContext<'_, '_, '_, 'info, MintV2<'info>> {
      let cpi_accounts = MintV2 {
          candy_guard: self.candy_guard.to_account_info(),
          candy_machine_program: self.candy_machine_program.to_account_info(),
          candy_machine: self.candy_machine.to_account_info(),
          candy_machine_authority_pda: self.candy_machine_authority_pda.to_account_info(),
          payer: self.payer.to_account_info(),
          minter: self.program_admin_pda.to_account_info(),
          nft_mint: self.nft_mint.to_account_info(),
          nft_mint_authority: self.nft_mint_authority.to_account_info(),
          nft_metadata: self.nft_metadata.to_account_info(),
          nft_master_edition: self.nft_master_edition.to_account_info(),
          token: None,
          token_record: None,
          collection_delegate_record: self.collection_delegate_record.to_account_info(),
          collection_mint: self.collection_mint.to_account_info(),
          collection_metadata: self.collection_metadata.to_account_info(),
          collection_master_edition: self.collection_master_edition.to_account_info(),
          collection_update_authority: self.collection_update_authority.to_account_info(),
          token_metadata_program: self.token_metadata_program.to_account_info(),
          spl_ata_program: None,
          spl_token_program: self.token_program.to_account_info(),
          system_program: self.system_program.to_account_info(),
          sysvar_instructions: self.sysvar_instructions.to_account_info(),
          recent_slothashes: self.recent_slothashes.to_account_info(),
          authorization_rules: None,
          authorization_rules_program: None,
      };
      CpiContext::new(self.candy_guard_program.to_account_info(), cpi_accounts)
  }
}
