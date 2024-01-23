use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("invalid call")]
    InvalidCall,
    #[msg("unable to get stake details bump")]
    StakeBumpError,
}
