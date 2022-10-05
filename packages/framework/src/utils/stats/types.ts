import {DateTime, Duration, Interval} from 'luxon'
import { StorageValueStream } from '@aleph-indexer/core'
import { TimeSeriesStats } from './timeSeries.js'
import { StatsTimeSeriesStorage } from './dal/statsTimeSeries.js'

export type IntervalWithType = {
  interval: Interval
  type: string
}

export type PrevValueFactoryFnArgs = {
  account: string
  type: string
  timeFrame: Duration
  interval: Interval
  reverse?: boolean
}

export type InputStreamFactoryFnArgs = {
  account: string
  startDate: DateTime
  endDate: DateTime
}

export type TimeSeriesAggregatorFnArgs<I, O> = {
  input: I | O
  interval: Interval
  prevValue?: O
  cache: Record<string, unknown>
}

export type AccountAggregatorFnArgs = {
  now: DateTime
  account: string
  timeSeriesDAL: StatsTimeSeriesStorage
}

export type TimeSeriesStatsConfig<I, O> = {
  type: string
  startDate: DateTime
  timeFrames: Duration[]
  getInputStream: (
    args: InputStreamFactoryFnArgs,
  ) => Promise<StorageValueStream<I>>
  aggregate: (args: TimeSeriesAggregatorFnArgs<I, O>) => O
  // getPrevValue?: (
  //   args: PrevValueFactoryFnArgs,
  //   defaultFn: (args: PrevValueFactoryFnArgs) => Promise<O | undefined>,
  // ) => Promise<O | undefined>
  reverse?: boolean
}

export type AccountTimeSeriesStatsConfig = {
  account: string
  series: TimeSeriesStats<any, any>[]
  aggregate?: (args: AccountAggregatorFnArgs) => any
}

export type TypedValue = { type: string }

export type TimeSeriesItem<V = any> = {
  date: string // ISO left bound of the interval
  value: V & TypedValue
}

export type TimeSeries<V = any> = TimeSeriesItem<V>[]

export type AccountTimeSeriesStats<V = any> = {
  account: string
  type: string
  timeFrame: string
  series: TimeSeries<V>
}

export type AccountStats<V = any> = {
  account: string
  stats: V
}

export type AccountStatsFilters = {
  timeFrame: string
  startDate?: string
  endDate?: string
  limit?: number
  reverse?: boolean
}
