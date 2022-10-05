import { EntityStorage } from '@aleph-indexer/core'

export type StatsTimeSeries<T> = {
  account: string
  type: string
  // @note: time frame in millis
  timeFrame: number
  // @note: start date in millis
  startTimestamp: number
  // @note: end date in millis
  endTimestamp: number
  data: T
}

export type StatsTimeSeriesStorage = EntityStorage<StatsTimeSeries<any>>

const accountKey = {
  get: (e: StatsTimeSeries<unknown>) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: StatsTimeSeries<unknown>) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: StatsTimeSeries<unknown>) => e.timeFrame,
  length: 3,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: StatsTimeSeries<unknown>) => e.startTimestamp,
  length: EntityStorage.TimestampLength,
}

export function createStatsTimeSeriesDAL(path: string): StatsTimeSeriesStorage {
  return new EntityStorage<StatsTimeSeries<any>>({
    name: 'stats_time_series',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
  })
}
