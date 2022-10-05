import {
  LendingEvent,
  GlobalLendingStats,
  LendingReserveInfo,
  ReserveData,
} from '../types'
import MainDomain from '../domain/main.js'

export type ReservesFilters = {
  lendingMarket: string
  reserves?: string[]
  includeStats?: boolean
}

export type EventsFilters = {
  reserve: string
  types?: string[]
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type GlobalStatsFilters = ReservesFilters

export class APIResolver {
  constructor(protected domain: MainDomain) {}

  async getLendingMarkets(): Promise<string[]> {
    return this.domain.getLendingMarkets()
  }

  async getReserves(args: ReservesFilters): Promise<LendingReserveInfo[]> {
    const result = await this.filterReserves(args)
    return result.map(({ info, stats }) => ({ ...info, stats }))
  }

  async getEvents({
    reserve,
    types,
    startDate = 0,
    endDate = Date.now(),
    limit = 1000,
    skip = 0,
    reverse = true,
  }: EventsFilters): Promise<LendingEvent[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const typesMap = types ? new Set(types) : undefined

    const result: LendingEvent[] = []

    const events = await this.domain.getReserveEventsByTime(
      reserve,
      startDate,
      endDate,
      {
        reverse,
        limit: !typesMap ? limit + skip : undefined,
      },
    )

    // const events = this.eventDAL
    //   .useIndex('reserve_timestamp')
    //   .getAllFromTo([reserve, startDate], [reserve, endDate], {
    //     reverse,
    //     limit: !typesMap ? limit + skip : undefined,
    //   })

    for await (const { value } of events) {
      // @note: Filter by type
      if (typesMap && !typesMap.has(value.type)) continue

      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  async getGlobalStats(args: GlobalStatsFilters): Promise<GlobalLendingStats> {
    const result = await this.filterReserves(args)
    const addresses = result.map(({ info }) => info.address)

    return this.domain.getGlobalStats(addresses)
  }

  protected async filterReserves({
    lendingMarket,
    reserves,
    includeStats,
  }: ReservesFilters): Promise<ReserveData[]> {
    const domReserves = await this.domain.getReserves(includeStats)

    reserves =
      reserves ||
      Object.values(domReserves).map((reserve: any) => reserve.info.address)

    let result = reserves
      .map((address) => domReserves[address])
      .filter((reserve) => !!reserve)

    if (lendingMarket) {
      result = result.filter(
        ({ info }) => info.lendingMarketAddress === lendingMarket,
      )
    }

    return result
  }
}
