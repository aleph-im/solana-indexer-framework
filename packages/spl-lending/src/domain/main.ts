import BN from 'bn.js'
import { StorageStream, constants } from '@aleph-indexer/core'
import {
  IndexerMainDomain,
  IndexerMainDomainWithDiscovery,
  IndexerMainDomainWithStats,
  AccountIndexerConfigWithMeta,
  IndexerMainDomainContext,
  AccountStats,
} from '@aleph-indexer/framework'
import {
  GlobalLendingStats,
  LendingEvent,
  LendingReserveInfo,
  LendingReserveStats,
  ReserveData,
} from '../types.js'
import { DiscovererFactory } from './discoverer/index.js'
import { LendingDiscoverer } from './discoverer/types.js'

const { usdDecimals } = constants

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery, IndexerMainDomainWithStats
{
  protected stats!: GlobalLendingStats

  constructor(
    protected context: IndexerMainDomainContext,
    protected discovererFactory: typeof DiscovererFactory = DiscovererFactory,
  ) {
    super(context, {
      discoveryInterval: 1000 * 60 * 60 * 1,
      stats: 1000 * 60 * 5,
    })
  }

  async discoverAccounts(): Promise<
    AccountIndexerConfigWithMeta<LendingReserveInfo>[]
  > {
    const { projectId } = this.context

    const discoverer: LendingDiscoverer =
      await this.discovererFactory.getSingleton(projectId)

    const reserves = await discoverer.loadReserves()

    return reserves.map((meta) => {
      return {
        account: meta.address,
        meta,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          content: false,
        },
      }
    })
  }

  async getReserves(
    includeStats?: boolean,
  ): Promise<Record<string, ReserveData>> {
    const reserves: Record<string, ReserveData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const reserve = await this.getReserve(account, includeStats)
        reserves[account] = reserve as ReserveData
      }),
    )

    return reserves
  }

  async getReserve(
    account: string,
    includeStats?: boolean,
  ): Promise<ReserveData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getReserveInfo',
    })) as LendingReserveInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getReserveStats',
    })) as AccountStats<LendingReserveStats>

    return { info, stats }
  }

  async getLendingMarkets(): Promise<string[]> {
    const reserves = await this.getReserves()

    return Object.keys(
      Object.values(reserves)
        .map((reserve) => reserve.info.lendingMarketAddress)
        .reduce((acc, curr) => {
          acc[curr] = true
          return acc
        }, {} as Record<string, boolean>),
    )
  }

  async getReserveEventsByTime(
    account: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, LendingEvent>> {
    const stream = await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getReserveEventsByTime',
      args: [startDate, endDate, opts],
    })

    console.log('getReserveEventsByTime stream', typeof stream)
    return stream as StorageStream<string, LendingEvent>
  }

  async updateStats(now: number): Promise<void> {
    this.stats = await this.computeGlobalStats()
  }

  async getGlobalStats(addresses: string[]): Promise<GlobalLendingStats> {
    if (!addresses || addresses.length === 0) {
      if (!this.stats) {
        await this.updateStats(Date.now())
      }

      return this.stats
    }

    return this.computeGlobalStats(addresses)
  }

  protected async computeGlobalStats(
    addresses?: string[],
  ): Promise<GlobalLendingStats> {
    const accountStats = await this.getAccountStats(addresses)

    const globalStats: GlobalLendingStats = this.getNewGlobalStats()

    for (const { stats } of accountStats) {
      if (!stats) continue

      // @note: Calculate last stats from reserves
      const {
        liquidityTotalUsd,
        borrowedTotalUsd,
        totalDepositedUsd,
        flashLoansTotalUsd,
      } = stats

      globalStats.liquidityTotalUsd.iadd(new BN(liquidityTotalUsd, 'hex'))
      globalStats.borrowedTotalUsd.iadd(new BN(borrowedTotalUsd, 'hex'))
      globalStats.totalDepositedUsd.iadd(new BN(totalDepositedUsd, 'hex'))
      globalStats.flashLoanedTotalUsd.iadd(new BN(flashLoansTotalUsd, 'hex'))
    }

    return globalStats
  }

  protected getNewGlobalStats(): GlobalLendingStats {
    return {
      liquidityTotalUsd: new BN(0),
      borrowedTotalUsd: new BN(0),
      totalDepositedUsd: new BN(0),
      flashLoanedTotalUsd: new BN(0),
      quantityDecimals: usdDecimals,
    }
  }
}
