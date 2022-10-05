import { SolendMarket } from '@solendprotocol/solend-sdk'
import { solanaPrivateRPC } from '@aleph-indexer/core'
import { ACCOUNT_MAP } from '../constants.js'

// weird hack against solend SDK's weird hack
import BN from 'bn.js'
import '@solendprotocol/solend-sdk'
BN.prototype.toJSON = function toJSON() {
  return this.toString(16, 2)
}

export const SOLEND_SDK = await SolendMarket.initialize(
  solanaPrivateRPC.getConnection(),
  'production',
  ACCOUNT_MAP['solend'].mainMarket,
)
