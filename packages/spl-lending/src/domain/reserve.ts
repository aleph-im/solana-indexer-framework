import { StorageStream } from '@aleph-indexer/core'
import {
  AccountTimeSeriesStatsManager,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../dal/event.js'
import { LendingEvent, LendingReserveInfo } from '../types'

export class Reserve {
  constructor(
    public info: LendingReserveInfo,
    protected eventDAL: EventStorage,
    protected timeSeriesStats: AccountTimeSeriesStatsManager,
  ) {}

  async updateStats(now: number): Promise<void> {
    await this.timeSeriesStats.process(now)
  }

  async getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    return this.timeSeriesStats.getTimeSeriesStats(type, filters)
  }

  async getStats(): Promise<AccountStats> {
    return this.timeSeriesStats.getStats()
  }

  getEventsByTime(
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, LendingEvent>> {
    return this.eventDAL
      .useIndex(EventDALIndex.ReserveTimestamp)
      .getAllFromTo(
        [this.info.address, startDate],
        [this.info.address, endDate],
        opts,
      )
  }
}
