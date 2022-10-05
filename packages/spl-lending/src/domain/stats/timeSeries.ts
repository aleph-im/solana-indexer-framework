import {
  AccountTimeSeriesStatsManager,
  candleIntervalToDuration,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../../dal/event.js'
import { LendingEvent, LendingInfo } from '../../types'
import { ReserveStatsAggregatorFactory } from './reserve/index.js'
import lendingEventAggregator from './timeSeriesAggregator.js'
import { DateTime } from 'luxon'
import { TIME_FRAMES } from '../../constants.js'

export async function createAccountStats(
  projectId: string,
  account: string,
  indexerApi: IndexerMsI,
  eventDAL: EventStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): Promise<AccountTimeSeriesStatsManager> {
  const reserveStatsAggregator =
    await ReserveStatsAggregatorFactory.getSingleton(projectId)

  const LendingTimeSeries = new TimeSeriesStats<LendingEvent, LendingInfo>(
    {
      type: 'lending',
      startDate: DateTime.fromMillis(0),
      timeFrames: TIME_FRAMES.map((tf) => candleIntervalToDuration(tf)),
      getInputStream: ({ account, startDate, endDate }) => {
        return eventDAL
          .useIndex(EventDALIndex.ReserveTimestamp)
          .getAllValuesFromTo([account, startDate.toMillis()], [account, endDate.toMillis()])
      },
      aggregate: ({ input, prevValue }): LendingInfo => {
        return lendingEventAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  const accountTimeSeries = new AccountTimeSeriesStatsManager(
    {
      account,
      series: [LendingTimeSeries],
      aggregate(args) {
        return reserveStatsAggregator.aggregate(args)
      },
    },
    indexerApi,
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return accountTimeSeries
}
