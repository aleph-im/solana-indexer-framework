import BN from 'bn.js'
import { SolendReserve } from '@solendprotocol/solend-sdk'
import { Token, solanaPrivateRPC } from '@aleph-indexer/core'
import { WAD } from '../../../constants.js'
import { LendingReserveInfo } from '../../../types.js'
import { LendingDiscoverer } from '../types.js'
import { SOLEND_SDK } from '../../../utils/solend-sdk.js'

export default class SolendDiscoverer implements LendingDiscoverer {
  constructor(
    protected sdk = SOLEND_SDK,
    protected cache: Record<string, LendingReserveInfo> = {},
  ) {}

  async loadReserves(): Promise<LendingReserveInfo[]> {
    const conn = solanaPrivateRPC.getConnection()
    const newReserves: LendingReserveInfo[] = []

    await this.sdk.loadAll()

    const reserves = this.sdk.reserves
    const lendingMarketAddress = this.sdk.config?.address as string

    for (const reserve of reserves) {
      const address = reserve.config.address.toString()
      if (this.cache[address]) continue

      const reserveLiquidityMint = reserve.config.mintAddress.toString()
      const reserveLiquidityVault = reserve.config.liquidityAddress.toString()
      const collateralMintAddress =
        reserve.config.collateralMintAddress.toString()
      const reserveCollateralVault =
        reserve.config.collateralSupplyAddress.toString()
      const pythPriceOracle = reserve.config.priceAddress.toString()
      const switchboardFeedAddress =
        reserve.config.switchboardFeedAddress.toString()

      const liquidityFeeReceiver =
        reserve.config.liquidityFeeReceiverAddress.toString()
      const quantityDecimals = reserve.config.decimals
      const quantityMultiplier = new BN(10)
        .pow(new BN(quantityDecimals))
        .toString()

      if (!reserve.stats) throw new Error('Received no stats!')

      const assetPrice = reserve.stats.assetPriceUSD
      const collateralExchangeRate = reserve.stats.cTokenExchangeRate
      const borrowInterestAPY = reserve.stats.borrowInterestAPY
      const depositLimit = reserve.stats.depositLimit.div(WAD)

      const loanToValueRatio = reserve.stats.loanToValueRatio
      const optimalUtilizationRatio = reserve.stats.optimalUtilizationRate
      const optimalBorrowRate = reserve.stats.optimalBorrowRate
      const minBorrowRate = reserve.stats.minBorrowRate
      const maxBorrowRate = reserve.stats.maxBorrowRate
      const borrowFeePercentage = reserve.stats.borrowFeePercentage
      const liquidationThreshold = reserve.stats.liquidationThreshold
      const liquidationPenalty = reserve.stats.liquidationBonus // no, no, it's a "bonus"

      // eslint-disable-next-line prefer-const
      let [liquidityToken, collateralToken] = await Promise.all([
        Token.getTokenByAddress(reserveLiquidityMint, conn),
        Token.getTokenByAddress(collateralMintAddress, conn),
      ])

      if (!liquidityToken || !collateralToken) continue

      if (collateralToken.name === 'Unknown') {
        collateralToken = {
          ...collateralToken,
          symbol: `p${liquidityToken.symbol}`,
          name: `Solend Finance ${liquidityToken.symbol}`,
          tags: ['solend', 'lending', 'collateral-tokens'],
          extensions: { website: 'https://solend.fi' },
        }
      }

      const name = liquidityToken.symbol

      const reserveInfo: LendingReserveInfo = {
        name,
        address,
        version: 1,
        lendingMarketAddress,
        pythPriceOracle,
        switchboardFeedAddress,
        liquidityToken,
        collateralToken,
        reserveLiquidityVault,
        reserveCollateralVault,
        liquidityFeeReceiver,
        quantityDecimals,
        quantityMultiplier,
        assetPrice,
        collateralExchangeRate,
        borrowInterestAPY,
        depositLimit,
        loanToValueRatio,
        optimalUtilizationRatio,
        optimalBorrowRate,
        minBorrowRate,
        maxBorrowRate,
        borrowFeePercentage,
        liquidationThreshold,
        liquidationPenalty,
      }

      this.cache[address] = reserveInfo

      newReserves.push(reserveInfo)
    }

    console.log(`SOLEND ${newReserves.length} reserves detected (from API)`)

    return newReserves
  }

  async loadReserve(address: string): Promise<SolendReserve> {
    const reserve = this.sdk.reserves.find(
      (reserve: SolendReserve) => reserve.config.address === address,
    ) as SolendReserve
    reserve.setBuffer(null) // force refresh
    await reserve.load()
    return reserve
  }
}
