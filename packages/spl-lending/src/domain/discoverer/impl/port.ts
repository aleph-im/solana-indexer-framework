import { TokenInfo } from '@solana/spl-token-registry'
import { Port, ReserveId, ReserveInfo } from '@port.finance/port-sdk'
import { Token, solanaPrivateRPC } from '@aleph-indexer/core'
import { LendingReserveInfo } from '../../../types.js'
import { LendingDiscoverer } from '../types.js'
import { PORT_SDK } from '../../../utils/port-sdk.js'

export default class PortDiscoverer implements LendingDiscoverer {
  constructor(
    protected sdk: Port = PORT_SDK,
    protected cache: Record<string, LendingReserveInfo> = {},
  ) {}

  async loadReservesAddresses(): Promise<string[]> {
    const context = await this.sdk.getReserveContext()
    const reserves = context.getAllReserves()

    return reserves.map((reserve) => reserve.getReserveId().toString())
  }

  async loadReserves(): Promise<LendingReserveInfo[]> {
    const conn = solanaPrivateRPC.getConnection()
    const newReserves: LendingReserveInfo[] = []

    const context = await this.sdk.getReserveContext()
    const reserves = context.getAllReserves()

    for (const reserve of reserves) {
      const address = reserve.getReserveId().toString()

      if (this.cache[address]) continue

      const lendingMarketAddress = reserve.getMarketId().toString()
      const reserveLiquidityMint = reserve.getAssetMintId().toString()
      const reserveLiquidityVault = reserve.getAssetBalanceId().toString()
      const reserveCollateralMint = reserve.getShareMintId().toString()
      const reserveCollateralVault = reserve.getShareBalanceId().toString()
      const pythPriceOracle = reserve.getOracleId()?.toString()

      const liquidityFeeReceiver = reserve.getFeeBalanceId().toString()
      const quantityMultiplier = reserve
        .getQuantityContext()
        .multiplier.toString()
      const quantityDecimals = reserve.getQuantityContext().decimals

      const stakingPool = reserve.getStakingPoolId()?.toString()

      const loanToValueRatio =
        reserve.params.loanToValueRatio?.toOneBasedNumber(4) as number

      const optimalUtilizationRatio = reserve.params.optimalUtilizationRatio
        .getPct()
        ?.toOneBasedNumber(4) as number

      const optimalBorrowRate = reserve.params.optimalBorrowRate
        .getPct()
        ?.toOneBasedNumber(4) as number

      const minBorrowRate = reserve.params.minBorrowRate
        .getPct()
        ?.toOneBasedNumber(4) as number

      const maxBorrowRate = reserve.params.maxBorrowRate
        .getPct()
        ?.toOneBasedNumber(4) as number

      const liquidationThreshold =
        reserve.params.liquidationThreshold.toOneBasedNumber(4)

      const liquidationPenalty =
        reserve.params.liquidationPenalty.toOneBasedNumber(4)

      // eslint-disable-next-line prefer-const
      let [liquidityToken, collateralToken] = await Promise.all([
        Token.getTokenByAddress(reserveLiquidityMint, conn),
        Token.getTokenByAddress(reserveCollateralMint, conn),
      ])

      if (!liquidityToken || !collateralToken) continue

      const info = this.updateTokenInfo(liquidityToken, collateralToken)
      liquidityToken = info.liquidityToken
      collateralToken = info.collateralToken

      const name = liquidityToken.symbol

      const reserveInfo: LendingReserveInfo = {
        name,
        address,
        version: 1,
        lendingMarketAddress,
        pythPriceOracle,
        liquidityToken,
        collateralToken,
        reserveLiquidityVault,
        reserveCollateralVault,
        liquidityFeeReceiver,
        quantityMultiplier,
        quantityDecimals,
        stakingPool,
        loanToValueRatio,
        optimalUtilizationRatio,
        optimalBorrowRate,
        minBorrowRate,
        maxBorrowRate,
        liquidationThreshold,
        liquidationPenalty,
      }

      this.cache[address] = reserveInfo

      newReserves.push(reserveInfo)
    }

    console.log(`=> ${newReserves.length} reserves detected (from API)`)

    return newReserves
  }

  async loadReserve(address: string): Promise<ReserveInfo> {
    const context = await this.sdk.getReserveContext()
    return context.getReserve(ReserveId.fromBase58(address))
  }

  protected updateTokenInfo(
    liquidityToken: TokenInfo,
    collateralToken: TokenInfo,
  ): {
    liquidityToken: TokenInfo
    collateralToken: TokenInfo
  } {
    if (collateralToken.name === 'Unknown') {
      collateralToken = {
        ...collateralToken,
        symbol: `p${liquidityToken.symbol}`,
        name: `Port Finance ${liquidityToken.symbol}`,
        tags: ['port', 'lending', 'collateral-tokens'],
        extensions: { website: 'https://port.finance' },
      }
    }

    return {
      liquidityToken,
      collateralToken,
    }
  }
}
