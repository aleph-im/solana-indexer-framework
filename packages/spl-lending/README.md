# SPL Lending indexer

## Utils

- https://crates.io/crates/port-variable-rate-lending-instructions
- https://github.com/port-finance/port-sdk/blob/master/src
- https://github.com/port-finance/liquidator/tree/main/src
- https://github.com/port-finance/port-sdk/blob/master/src/structs/ReserveData.ts#L168
- https://github.com/ProjectLarix/larix-api-server/blob/4025ae358051213871bb8c0247973f91a5fa09e0/src/sdk/models/state/reserve.js#L95

## Flows

### [ix 0x03 RefreshReserve]

1. Reserve is refreshed using `reserve` and `clockProgram` accounts

### [ix 0x04 DepositReserveLiquidity]

1. Funds are transfered from `userLiquidity` to `reserveLiquidityVault` account
2. Collateral token is minted using `reserveCollateralMint` to `userCollateral` account

### [ix 0x05 RedeemReserveCollateral]

1. Collateral token is burned using `reserveCollateralMint` from `userCollateral` account
2. Funds are transfered back from `reserveLiquidityVault` to `userLiquidity` account

### [ix 0x06 InitObligation]

1. A new `obligation` account (program) is created and inited with `obligationOwner` account as virtual owner (the real owner is the port finance program)

### [ix 0x07 RefreshObligation]

1. Refresh an `obligation` account in the same tx before doing any depositing / withdrawing / repaying / liquidating ix, accepts an array of `reserve` accounts related with the obligation

### [ix 0x08 DepositObligationCollateral]

1. Transfer collateral from `userCollateral` to `reserveCollateralVault` account
2. Staking transfer (TODO)

### [ix 0x09 WithdrawObligationCollateral]

1. Transfer collateral from `reserveCollateralVault` to `userCollateral` account
2. Staking transfer (TODO)

### [ix 0x10 BorrowObligationLiquidity]

1. Transfer borrow fee from `reserveLiquidityVault` to `liquidityFeeReceiver` account
2. Transfer borrowed funds from `reserveLiquidityVault` to `userLiquidity` account

### [ix 0x11 RepayObligationLiquidity]

1. Transfer from `userLiquidity` to `reserveLiquidityVault` account for repaying the borrowed amount 

### [ix 0x12 LiquidateObligation]

1. Transfer from `userLiquidity` to `reserveLiquidityVault` account for repaying the borrowed amount
2. Transfer collateral from `reserveCollateralVault` to `userCollateral` account
3. Staking transfer (TODO)

### [ix 0x0e DepositReserveLiquidityAndObligationCollateral]

1. Performs ix 0x04 DepositReserveLiquidity
2. Performs ix 0x08 DepositObligationCollateral

## Ownership

- lendingMarketAuthority is the owner of:
  - lendingMarket
  - reserveCollateralMint
  - reserveCollateralVault

- obligationOwner is the owner of:
  - obligation
  - userCollateral
  - userLiquidity

- transferAuthority is the owner of:
  - userCollateral (and participate in transfer ixs as authority)

## Instructions that have an impact on the total deposited value

- BorrowObligationLiquidity
- RepayObligationLiquidity
- LiquidateObligation
- DepositReserveLiquidity
- RedeemReserveCollateral
- DepositReserveLiquidityAndObligationCollateral

## TODO

- [ ] Create local price index fetching markets (+ last price) from serum indexer

- Deposits
  - [ ] Deposit Interest [blocked]
  - Global (USD)
    - [x] Total Deposits
    - [ ] Total Deposits (1h, 24h, 7d) [blocked]
    - [ ] Hourly Deposits (1h, 24h, 7d) [blocked]
  - Per reserve
    - [x] Total Deposits
    - [x] Total Deposits (1h, 24h, 7d)
    - [x] Hourly Deposits (1h, 24h, 7d)

- Borrowed
  - [ ] Borrow Interest [blocked]
  - Global (USD)
    - [x] Total Borrowed
    - [ ] Total Borrowed (1h, 24h, 7d) [blocked]
    - [ ] Hourly Borrowed (1h, 24h, 7d) [blocked]
    - [ ] Total Borrow Fees [blocked]
    - [ ] Total Borrow Fees (1h, 24h, 7d) [blocked]
    - [ ] Hourly Borrow Fees (1h, 24h, 7d)
  - Per reserve
    - [x] Total Borrowed
    - [x] Total Borrowed (1h, 24h, 7d)
    - [x] Hourly Borrowed (1h, 24h, 7d)
    - [ ] Total Borrow Fees [blocked]
    - [ ] Total Borrow Fees (1h, 24h, 7d) [blocked]
    - [x] Hourly Borrow Fees (1h, 24h, 7d)

- Liquidations
  - Per reserve
    - [x] Liquidation transactions
    - [x] Hourly Liquidation volume (1h, 24h, 7d)
    - [x] Hourly Liquidation profit (1h, 24h, 7d)

- Current state
  - [x] Borrow APY
  - [x] Deposit APY
  - [x] Loan to Value ratio (LTV)

- [ ] Total Flash loan fees (1h, 24h, 7d) [blocked]
- [ ] Per address transactions deposit history
- [ ] Per address transactions PnL [blocked]
