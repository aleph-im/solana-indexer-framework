import { StorageStream, Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  InstructionContextV1,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { eventParser as eParser } from '../parsers/event.js'
import { createEventDAL } from '../dal/event.js'
import { LendingEvent, LendingReserveInfo } from '../types.js'
import { Reserve } from './reserve.js'
import { createAccountStats } from './stats/timeSeries.js'
import { ACCOUNT_MAP } from '../constants.js'

const { isParsedIx } = Utils

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements IndexerWorkerDomainWithStats
{
  protected reserves: Record<string, Reserve> = {}

  constructor(
    protected context: IndexerDomainContext,
    protected eventParser = eParser,
    protected eventDAL = createEventDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected programId = ACCOUNT_MAP[context.projectId],
  ) {
    super(context)
  }

  async init(): Promise<void> {
    return
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<LendingReserveInfo>,
  ): Promise<void> {
    const { account, meta } = config
    const { projectId, apiClient: indexerApi } = this.context

    const accountTimeSeries = await createAccountStats(
      projectId,
      account,
      indexerApi,
      this.eventDAL,
      this.statsStateDAL,
      this.statsTimeSeriesDAL,
    )

    this.reserves[account] = new Reserve(meta, this.eventDAL, accountTimeSeries)

    console.log('Account indexing', this.context.instanceName, account)
  }

  async updateStats(account: string, now: number): Promise<void> {
    const reserve = this.getReserve(account)
    await reserve.updateStats(now)
  }

  async getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    const reserve = this.getReserve(account)
    return reserve.getTimeSeriesStats(type, filters)
  }

  async getStats(account: string): Promise<AccountStats> {
    return this.getReserveStats(account)
  }

  // ------------- Custom impl methods -------------------

  async getReserveInfo(reserve: string): Promise<LendingReserveInfo> {
    const res = this.getReserve(reserve)
    return res.info
  }

  async getReserveStats(reserve: string): Promise<AccountStats> {
    const res = this.getReserve(reserve)
    return res.getStats()
  }

  getReserveEventsByTime(
    reserve: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, LendingEvent>> {
    const res = this.getReserve(reserve)
    return res.getEventsByTime(startDate, endDate, opts)
  }

  protected async filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]> {
    return ixsContext.filter(({ ix }) => {
      return isParsedIx(ix) && ix.programId === this.programId.program
    })
  }

  protected async indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void> {
    const parsedIxs = ixsContext.map((ix) => this.eventParser.parse(ix))

    console.log(`indexing ${ixsContext.length} parsed ixs`)

    await this.eventDAL.save(parsedIxs)
  }

  private getReserve(reserve: string): Reserve {
    const reserveInstance = this.reserves[reserve]
    if (!reserveInstance) throw new Error(`Reserve ${reserve} does not exist`)
    return reserveInstance
  }
}
