import { Port } from '@port.finance/port-sdk'
import { solanaPrivateRPC } from '@aleph-indexer/core'

export const PORT_SDK = Port.forMainNet({
  connection: solanaPrivateRPC.getConnection(),
})
