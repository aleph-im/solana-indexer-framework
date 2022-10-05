import { TokenInfo } from '@solana/spl-token-registry'
import { LARIX_SDK } from '../../../utils/larix-sdk.js'
import { LendingDiscoverer } from '../types.js'
import PortDiscoverer from './port.js'

export default class LarixDiscoverer
  extends PortDiscoverer
  implements LendingDiscoverer
{
  constructor(protected sdk = LARIX_SDK) {
    super(sdk)
  }

  protected updateTokenInfo(
    liquidityToken: TokenInfo,
    collateralToken: TokenInfo,
  ): {
    liquidityToken: TokenInfo
    collateralToken: TokenInfo
  } {
    const info = this.sdk.reserveSymbolMap[liquidityToken.address]

    if (info) {
      liquidityToken = {
        ...liquidityToken,
        ...info,
        tags: ['larix', 'lending'],
        extensions: { website: 'https://projectlarix.com/' },
      }
    }

    if (collateralToken.name === 'Unknown') {
      collateralToken = {
        ...collateralToken,
        symbol: `l${liquidityToken.symbol}`,
        name: `Larix Finance ${liquidityToken.symbol}`,
        tags: ['larix', 'lending', 'collateral-tokens'],
        extensions: { website: 'https://projectlarix.com/' },
      }
    }

    return {
      liquidityToken,
      collateralToken,
    }
  }
}
