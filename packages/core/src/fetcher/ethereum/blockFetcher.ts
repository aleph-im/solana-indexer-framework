import { EthereumClient } from '../../rpc/ethereum/client.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import { BaseFetcher } from '../base/baseFetcher.js'
import {
  BaseFetcherJobState,
  BaseFetcherOptions,
  BaseFetcherState,
  FetcherJobRunnerHandleFetchResult,
} from '../base/types.js'
import {
  EthereumBlockFetcherOptions,
  EthereumBlockPaginationCursor,
  EthereumBlockPaginationCursors,
  EthereumFetchBlocksOptions,
} from './types.js'

export class EthereumBlockFetcher extends BaseFetcher<EthereumBlockPaginationCursor> {
  constructor(
    protected opts: EthereumBlockFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumBlockPaginationCursor>,
    protected ethereumClient: EthereumClient,
  ) {
    const forward = typeof opts.forward === 'boolean' ? {} : opts.forward
    const backward = typeof opts.backward === 'boolean' ? {} : opts.backward

    const config: BaseFetcherOptions<EthereumBlockPaginationCursor> = {
      id: `ethereum:block`,
    }

    if (forward) {
      config.jobs = config.jobs || {}
      config.jobs.forward = {
        ...forward,
        interval: forward.interval || 1000 * 10,
        intervalMax: forward.intervalMax || 1000 * 10,
        handleFetch: () => this.runForward(),
        checkComplete: async () => false,
      }
    }

    if (backward) {
      config.jobs = config.jobs || {}
      config.jobs.backward = {
        ...backward,
        interval: backward.interval || 0,
        handleFetch: () => this.runBackward(),
        checkComplete: (ctx) => this.checkCompleteBackward(ctx),
      }
    }

    super(config, fetcherStateDAL)
  }

  protected async runForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockPaginationCursor>
  > {
    // @note: not "before" (autodetected by the node (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const maxLimit = !until ? 1000 : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      before: undefined,
      until,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchBlocks(options, true)

    return { lastCursors, error }
  }

  protected async runBackward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockPaginationCursor>
  > {
    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.height
    const maxLimit = 1000

    const options: EthereumFetchBlocksOptions = {
      until: undefined,
      before,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchBlocks(options, false)

    // @note: Stop the indexer if there wasnt more items
    const stop = !error && !lastCursors?.backward?.height
    const newInterval = stop ? JobRunnerReturnCode.Stop : undefined

    return { newInterval, lastCursors, error }
  }

  protected async fetchBlocks(
    options: EthereumFetchBlocksOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    lastCursors: EthereumBlockPaginationCursors
  }> {
    let error: undefined | Error
    let lastCursors: EthereumBlockPaginationCursors = {}

    console.log(`fetchBlocks [${goingForward ? 'forward' : 'backward'}]`)

    try {
      const blocks = this.ethereumClient.fetchBlocks(options)

      for await (const step of blocks) {
        const { chunk } = step

        await this.opts.indexBlocks(chunk, goingForward)

        lastCursors = step.cursors
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      lastCursors,
    }
  }

  protected async checkCompleteBackward(ctx: {
    fetcherState: BaseFetcherState<EthereumBlockPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { fetcherState, error } = ctx
    const lastHeight = fetcherState?.cursors?.backward?.height

    return !error && lastHeight === 0
  }
}
