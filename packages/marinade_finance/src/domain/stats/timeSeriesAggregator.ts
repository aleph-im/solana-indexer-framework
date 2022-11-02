import { AccessTimeStats } from '../../types.js'
import { ParsedEvents } from '../../utils/layouts/index.js'
import { PublicKey } from '@solana/web3.js'

export class AccessTimeSeriesAggregator {
  aggregate(
    curr: ParsedEvents | AccessTimeStats,
    prev?: AccessTimeStats,
  ): AccessTimeStats {
    prev = this.prepareAccessStats(prev)
    this.processAccessStats(prev, curr)

    return prev
  }

  getEmptyAccessTimeStats(): AccessTimeStats {
    return {
      accesses: 0,
      accessesByProgramId: {},
      startTimestamp: undefined,
      endTimestamp: undefined,
    }
  }

  protected prepareAccessStats(info?: AccessTimeStats): AccessTimeStats {
    return info || this.getEmptyAccessTimeStats()
  }

  // @note: We assume that curr data is sorted by time
  protected processAccessStats(
    acc: AccessTimeStats,
    curr: ParsedEvents | AccessTimeStats,
  ): AccessTimeStats {
    console.log('processAccessStats', acc, curr)
    if ((curr as ParsedEvents).data?.programId) {
      let programId: string;
      if ((curr as ParsedEvents).data?.programId instanceof PublicKey) {
        programId = (curr as ParsedEvents).data.programId.toBase58()
      } else {
        programId = (curr as ParsedEvents).data.programId as unknown as string
      }
      acc.accesses++
      acc.accessesByProgramId[programId] = acc.accessesByProgramId[programId]
        ? acc.accessesByProgramId[programId] + 1
        : 1
      acc.startTimestamp =
        acc.startTimestamp || (curr as ParsedEvents).timestamp
      acc.endTimestamp = (curr as ParsedEvents).timestamp || acc.endTimestamp
    } else {
      acc.accesses += (curr as AccessTimeStats).accesses || 0
      if ((curr as AccessTimeStats).accessesByProgramId) {
        Object.entries((curr as AccessTimeStats).accessesByProgramId).forEach(
          ([programId, count]) => {
            acc.accessesByProgramId[programId] = acc.accessesByProgramId[
              programId
            ]
              ? acc.accessesByProgramId[programId] + count
              : count
          },
        )
      }
      acc.startTimestamp =
        acc.startTimestamp || (curr as AccessTimeStats).startTimestamp
      acc.endTimestamp =
        (curr as AccessTimeStats).endTimestamp || acc.endTimestamp
    }
    return acc
  }

  protected isMarinadeFinanceEvent(
    event: ParsedEvents | AccessTimeStats,
  ): event is ParsedEvents {
    return 'type' in event
  }
}

export const accessAggregator = new AccessTimeSeriesAggregator()
export default accessAggregator
