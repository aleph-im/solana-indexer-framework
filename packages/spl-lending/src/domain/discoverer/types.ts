import { LendingReserveInfo } from '../../types'

export interface LendingDiscoverer {
  loadReserves(): Promise<LendingReserveInfo[]>
}
