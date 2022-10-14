use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod crowdfunding {
    use super::*;
  pub fn create(ctx: Context<Create>, name: String, description: String) -> ProgramResult{ //Result<()>
    let campain = &mut ctx.accounts.campain;
    campain.name = name;
    campain.description = description;
    campain.amount_donated = 0;
    campain.admin = *ctx.accounts.user.key;
    Ok(())
  }
  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
    let campain = &mut ctx.accounts.campain;
    let user = &mut ctx.accounts.user;
    if campain.admin != *user.key {
        return Err(ProgramError::IncorrectProgramId);
    }
    let rent_balance = Rent::get()?.minimum_balance(campain.to_account_info().data_len());
    if **campain.to_account_info().lamports.borrow() - rent_balance < amount{
        return Err(ProgramError::InsufficientFunds);
    }
    **campain.to_account_info().try_borrow_mut_lamports()?  -= amount;
    **user.to_account_info().try_borrow_mut_lamports()? += amount;
    Ok(())
  }
}
#[derive(Accounts)]
pub struct Create<'info>{
    #[account(init, payer=user, space = 9000, seeds=[b"CAMPAIGN_DEMO".as_ref(), user.key().as_ref()], bump)]
    pub campain: Account<'info, Campain>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info,System>

}
#[derive(Accounts)]
pub struct Withdraw<'info>{
    #[account(mut)]
    pub campain: Account<'info,Campain>,
    #[account(mut)]
    pub user: Signer<'info>
}


#[account]
pub struct Campain{
    pub admin: Pubkey,
    pub name: String,
    pub description: String,
    pub amount_donated: i64

}

