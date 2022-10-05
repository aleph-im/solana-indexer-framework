import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLFloat,
} from 'graphql'
import { TokenType, GraphQLLong, GraphQLBigNumber } from '@aleph-indexer/core'
import { LendingEventType } from '../types.js'

// ------------------- STATS ---------------------------

export const LendingInfo = new GraphQLObjectType({
  name: 'LendingInfo',
  fields: {
    liquidityEventsVol: { type: new GraphQLNonNull(GraphQLFloat) },
    liquidityVol: { type: new GraphQLNonNull(GraphQLBigNumber) },
    liquidity: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalLiquidity: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowedEventsVol: { type: new GraphQLNonNull(GraphQLFloat) },
    borrowedVol: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowed: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowFees: { type: new GraphQLNonNull(GraphQLBigNumber) },
    liquidationsEventsVol: { type: new GraphQLNonNull(GraphQLFloat) },
    liquidations: { type: new GraphQLNonNull(GraphQLBigNumber) },

    // totalBorrowed: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // liquidationBonus: { type: new GraphQLNonNull(GraphQLBigNumber) },

    // @todo
    // FlashLoans
    // liquidityUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalLiquidityUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // borrowedUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalBorrowedUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // borrowFeesUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalBorrowFees: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalBorrowFeesUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // liquidationsUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalLiquidations: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalLiquidationsUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // liquidationBonusUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalLiquidationBonus: { type: new GraphQLNonNull(GraphQLBigNumber) },
    // totalLiquidationBonusUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const GlobalStatsInfo = new GraphQLObjectType({
  name: 'GlobalStatsInfo',
  fields: {
    liquidityTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowedTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalDepositedUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    flashLoanedTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
    quantityDecimals: { type: new GraphQLNonNull(GraphQLFloat) },
  },
})

export const ReserveStats = new GraphQLObjectType({
  name: 'ReserveStats',
  fields: {
    last1h: { type: LendingInfo },
    last24h: { type: LendingInfo },
    last7d: { type: LendingInfo },
    total: { type: LendingInfo },

    borrowApy: { type: new GraphQLNonNull(GraphQLFloat) },
    supplyApy: { type: new GraphQLNonNull(GraphQLFloat) },
    exchangeRatio: { type: new GraphQLNonNull(GraphQLFloat) },
    utilizationRatio: { type: new GraphQLNonNull(GraphQLFloat) },
    markPrice: { type: new GraphQLNonNull(GraphQLFloat) },

    liquidityTotal: { type: new GraphQLNonNull(GraphQLBigNumber) },
    liquidityTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },

    totalDeposited: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalDepositedUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },

    borrowedTotal: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowedTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },

    flashLoanedTotal: { type: new GraphQLNonNull(GraphQLBigNumber) },
    flashLoanedTotalUsd: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

// ------------------- RESERVES --------------------------

export const Reserve = new GraphQLObjectType({
  name: 'Reserve',
  fields: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAddress: { type: new GraphQLNonNull(GraphQLString) },
    liquidityToken: { type: TokenType },
    collateralToken: { type: TokenType },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
    liquidityFeeReceiver: { type: new GraphQLNonNull(GraphQLString) },
    quantityMultiplier: { type: new GraphQLNonNull(GraphQLString) },
    quantityDecimals: { type: new GraphQLNonNull(GraphQLFloat) },
    loanToValueRatio: { type: new GraphQLNonNull(GraphQLFloat) },
    optimalUtilizationRatio: { type: new GraphQLNonNull(GraphQLFloat) },
    optimalBorrowRate: { type: new GraphQLNonNull(GraphQLFloat) },
    minBorrowRate: { type: new GraphQLNonNull(GraphQLFloat) },
    maxBorrowRate: { type: new GraphQLNonNull(GraphQLFloat) },
    liquidationThreshold: { type: new GraphQLNonNull(GraphQLFloat) },
    liquidationPenalty: { type: new GraphQLNonNull(GraphQLFloat) },
    pythPriceOracle: { type: GraphQLString },
    switchboardFeedAddress: { type: GraphQLString },
    assetPrice: { type: GraphQLFloat },
    collateralExchangeRate: { type: GraphQLFloat },
    depositLimit: { type: GraphQLBigNumber },
    stakingPool: { type: GraphQLString },
    borrowInterestAPY: { type: GraphQLFloat },
    borrowFeePercentage: { type: GraphQLFloat },
    stats: { type: ReserveStats },
  },
})

export const Reserves = new GraphQLList(Reserve)

export const LendingMarkets = new GraphQLList(GraphQLString)

// ------------------- EVENTS --------------------------

export const EventType = new GraphQLEnumType({
  name: 'EventType',
  values: {
    initReserve: { value: 'initReserve' },
    depositReserveLiquidity: { value: 'depositReserveLiquidity' },
    redeemReserveCollateral: { value: 'redeemReserveCollateral' },
    depositObligationCollateral: { value: 'depositObligationCollateral' },
    withdrawObligationCollateral: { value: 'withdrawObligationCollateral' },
    borrowObligationLiquidity: { value: 'borrowObligationLiquidity' },
    repayObligationLiquidity: { value: 'repayObligationLiquidity' },
    liquidateObligation: { value: 'liquidateObligation' },
    liquidateObligation2: { value: 'liquidateObligation2' },
    flashLoan: { value: 'flashLoan' },
    depositReserveLiquidityAndObligationCollateral: {
      value: 'depositReserveLiquidityAndObligationCollateral',
    },
    withdrawObligationCollateralAndRedeemReserveCollateral: {
      value: 'withdrawObligationCollateralAndRedeemReserveCollateral',
    },
  },
})

const commonEventFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  timestamp: { type: GraphQLLong },
  type: { type: new GraphQLNonNull(EventType) },
}

const Event = new GraphQLInterfaceType({
  name: 'Event',
  fields: {
    ...commonEventFields,
  },
})

export const EventInitReserve = new GraphQLObjectType({
  name: 'EventInitReserve',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.InitReserve,
  fields: {
    ...commonEventFields,
    liquidity: { type: GraphQLString },
    collateral: { type: GraphQLString },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityMint: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    liquidityFeeReceiver: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralMint: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: GraphQLString },
    lendingMarketOwner: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: GraphQLString },
    pythPriceOracle: { type: GraphQLString },
    switchboardFeedAddress: { type: GraphQLString },
  },
})

export const EventDepositReserveLiquidity = new GraphQLObjectType({
  name: 'EventDepositReserveLiquidity',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.DepositReserveLiquidity,
  fields: {
    ...commonEventFields,
    liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
    userCollateral: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralMint: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const EventRedeemReserveCollateral = new GraphQLObjectType({
  name: 'EventRedeemReserveCollateral',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.RedeemReserveCollateral,
  fields: {
    ...commonEventFields,
    liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    userCollateral: { type: new GraphQLNonNull(GraphQLString) },
    userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralMint: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: GraphQLString },
    stakingPool: { type: GraphQLString },
    stakingProgram: { type: GraphQLString },
    reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const EventDepositObligationCollateral = new GraphQLObjectType({
  name: 'EventDepositObligationCollateral',
  interfaces: [Event],
  isTypeOf: (item) =>
    item.type === LendingEventType.DepositObligationCollateral,
  fields: {
    ...commonEventFields,
    collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    userCollateral: { type: new GraphQLNonNull(GraphQLString) },
    reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    obligation: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    obligationOwner: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: GraphQLString },
    stakingPool: { type: GraphQLString },
    stakingProgram: { type: GraphQLString },
  },
})

export const EventWithdrawObligationCollateral = new GraphQLObjectType({
  name: 'EventWithdrawObligationCollateral',
  interfaces: [Event],
  isTypeOf: (item) =>
    item.type === LendingEventType.WithdrawObligationCollateral,
  fields: {
    ...commonEventFields,
    collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
    userCollateral: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    obligation: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    obligationOwner: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: GraphQLString },
    stakingPool: { type: GraphQLString },
    stakingProgram: { type: GraphQLString },
  },
})

export const EventBorrowObligationLiquidity = new GraphQLObjectType({
  name: 'EventBorrowObligationLiquidity',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.BorrowObligationLiquidity,
  fields: {
    ...commonEventFields,
    liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    liquidityFeeReceiver: { type: new GraphQLNonNull(GraphQLString) },
    obligation: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    obligationOwner: { type: new GraphQLNonNull(GraphQLString) },
    liquidityFeeAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const EventRepayObligationLiquidity = new GraphQLObjectType({
  name: 'EventRepayObligationLiquidity',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.RepayObligationLiquidity,
  fields: {
    ...commonEventFields,
    liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    obligation: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
    reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const eventLiquidateObligationFields = {
  ...commonEventFields,
  liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  liquidityRepayAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  collateralWithdrawAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
  userCollateral: { type: new GraphQLNonNull(GraphQLString) },
  repayReserve: { type: new GraphQLNonNull(GraphQLString) },
  repayReserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
  withdrawReserve: { type: new GraphQLNonNull(GraphQLString) },
  withdrawReserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
  obligation: { type: new GraphQLNonNull(GraphQLString) },
  lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
  lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
  transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
  stakeAccount: { type: GraphQLString },
  stakingPool: { type: GraphQLString },
  stakingProgram: { type: GraphQLString },
  repayReserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
}

export const EventLiquidateObligation = new GraphQLObjectType({
  name: 'EventLiquidateObligation',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.LiquidateObligation,
  fields: {
    ...eventLiquidateObligationFields,
  },
})

export const EventLiquidateObligation2 = new GraphQLObjectType({
  name: 'EventLiquidateObligation2',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.LiquidateObligation2,
  fields: {
    ...eventLiquidateObligationFields,
  },
})

export const EventFlashLoan = new GraphQLObjectType({
  name: 'EventFlashLoan',
  interfaces: [Event],
  isTypeOf: (item) => item.type === LendingEventType.FlashLoan,
  fields: {
    ...commonEventFields,
    liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
    userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
    reserve: { type: new GraphQLNonNull(GraphQLString) },
    liquidityFeeReceiver: { type: new GraphQLNonNull(GraphQLString) },
    hostFeeReceiver: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
    lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
    transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
    flashLoanReceiverProgram: { type: new GraphQLNonNull(GraphQLString) },
    flashLoanReceiverAddresses: {
      type: new GraphQLNonNull(GraphQLList(GraphQLString)),
    },
    liquidityFeeAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const EventDepositReserveLiquidityAndObligationCollateral =
  new GraphQLObjectType({
    name: 'EventDepositReserveLiquidityAndObligationCollateral',
    interfaces: [Event],
    isTypeOf: (item) =>
      item.type ===
      LendingEventType.DepositReserveLiquidityAndObligationCollateral,
    fields: {
      ...commonEventFields,
      liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
      collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
      userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
      userCollateral: { type: new GraphQLNonNull(GraphQLString) },
      reserve: { type: new GraphQLNonNull(GraphQLString) },
      reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
      reserveCollateralMint: { type: new GraphQLNonNull(GraphQLString) },
      lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
      lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
      reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
      obligation: { type: new GraphQLNonNull(GraphQLString) },
      obligationOwner: { type: new GraphQLNonNull(GraphQLString) },
      transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
      stakeAccount: { type: GraphQLString },
      stakingPool: { type: GraphQLString },
      stakingProgram: { type: GraphQLString },
      reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    },
  })

export const EventWithdrawObligationCollateralAndRedeemReserveCollateral =
  new GraphQLObjectType({
    name: 'EventWithdrawObligationCollateralAndRedeemReserveCollateral',
    interfaces: [Event],
    isTypeOf: (item) =>
      item.type ===
      LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral,
    fields: {
      ...commonEventFields,
      liquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
      collateralAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
      userLiquidity: { type: new GraphQLNonNull(GraphQLString) },
      userCollateral: { type: new GraphQLNonNull(GraphQLString) },
      reserve: { type: new GraphQLNonNull(GraphQLString) },
      reserveLiquidityVault: { type: new GraphQLNonNull(GraphQLString) },
      reserveCollateralMint: { type: new GraphQLNonNull(GraphQLString) },
      lendingMarket: { type: new GraphQLNonNull(GraphQLString) },
      lendingMarketAuthority: { type: new GraphQLNonNull(GraphQLString) },
      reserveCollateralVault: { type: new GraphQLNonNull(GraphQLString) },
      obligation: { type: new GraphQLNonNull(GraphQLString) },
      obligationOwner: { type: new GraphQLNonNull(GraphQLString) },
      transferAuthority: { type: new GraphQLNonNull(GraphQLString) },
      stakeAccount: { type: GraphQLString },
      stakingPool: { type: GraphQLString },
      stakingProgram: { type: GraphQLString },
      reserveLiquidityAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    },
  })

export const Events = new GraphQLList(Event)

export const types = [
  EventInitReserve,
  EventDepositReserveLiquidity,
  EventRedeemReserveCollateral,
  EventDepositObligationCollateral,
  EventWithdrawObligationCollateral,
  EventBorrowObligationLiquidity,
  EventRepayObligationLiquidity,
  EventLiquidateObligation,
  EventLiquidateObligation2,
  EventFlashLoan,
  EventDepositReserveLiquidityAndObligationCollateral,
  EventWithdrawObligationCollateralAndRedeemReserveCollateral,
]
