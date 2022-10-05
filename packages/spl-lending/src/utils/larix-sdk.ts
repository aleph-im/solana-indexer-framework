import { PublicKey } from '@solana/web3.js'
import { ENV } from '@solana/spl-token-registry'
import * as BufferLayout from '@solana/buffer-layout'
import * as Port from '@port.finance/port-sdk'
import {
  Environment,
  MarketId,
  Port as PortInstance,
  ReserveAssetInfo,
  ReserveContext,
  ReserveData,
  ReserveId,
  ReserveInfo,
  ReserveParams,
  ReserveTokenInfo,
} from '@port.finance/port-sdk'
import { constants, solanaPrivateRPC } from '@aleph-indexer/core'
import { ACCOUNT_MAP } from '../constants.js'

// ------------------------------------

export type ReserveSymbolMap = Record<
  string,
  { name?: string; symbol?: string; logoURI?: string }
>

export type LarixSDK = PortInstance & { reserveSymbolMap: ReserveSymbolMap }

// @note: As we are using the port SDK for parsing the reserves state we need to use Port.BigField.forType(Port.BigType.U64, Big.js version instead of Port.BigField.forType(Port.BigType.U64, BN
// @note: So we have to merge this two layouts:
// - https://github.com/port-finance/port-sdk/blob/master/src/structs/ReserveData.ts#L168
// - https://github.com/ProjectLarix/larix-api-server/blob/4025ae358051213871bb8c0247973f91a5fa09e0/src/sdk/models/state/reserve.js#L95

export const ReserveLayout = BufferLayout.struct([
  BufferLayout.u8('version'),

  Port.SlotInfoLayout('lastUpdate'),

  Port.publicKey('lendingMarket'),

  BufferLayout.struct(
    [
      Port.MintId.field('mintPubkey'),
      BufferLayout.u8('mintDecimals'),
      Port.TokenAccountId.field('supplyPubkey'),
      Port.TokenAccountId.field('feeReceiver'),

      BufferLayout.u8('usePythOracle'),
      Port.publicKey('params_1'),
      Port.publicKey('params_2'),

      Port.Lamport.field(Port.BigType.U64, 'availableAmount'),
      Port.Lamport.field(Port.BigType.D128, 'borrowedAmountWads'),
      Port.ExchangeRate.field(Port.BigType.D128, 'cumulativeBorrowRateWads'),
      Port.BigField.forType(Port.BigType.D128, 'marketPrice'),

      Port.BigField.forType(Port.BigType.D128, 'ownerUnclaimed'),
    ],
    'liquidity',
  ),

  BufferLayout.struct(
    [
      Port.MintId.field('mintPubkey'),
      Port.Lamport.field(Port.BigType.U64, 'mintTotalSupply'),
      Port.TokenAccountId.field('supplyPubkey'),
    ],
    'collateral',
  ),

  BufferLayout.struct(
    [
      Port.Percentage.field('optimalUtilizationRate'),
      Port.Percentage.field('loanToValueRatio'),
      Port.Percentage.field('liquidationBonus'),
      Port.Percentage.field('liquidationThreshold'),
      Port.Percentage.field('minBorrowRate'),
      Port.Percentage.field('optimalBorrowRate'),
      Port.Percentage.field('maxBorrowRate'),

      BufferLayout.struct(
        [
          Port.BigField.forType(Port.BigType.D64, 'borrowFeeWad'),
          Port.BigField.forType(Port.BigType.D64, 'borrowInterestFeeWad'),
          Port.BigField.forType(Port.BigType.D64, 'flashLoanFeeWad'),
          BufferLayout.u8('hostFeePercentage'),

          BufferLayout.u8('hostFeeReceiverCount'),
          BufferLayout.blob(32 * 5, 'hostFeeReceivers'),
        ],
        'fees',
      ),

      BufferLayout.u8('depositPaused'),
      BufferLayout.u8('borrowPaused'),
      BufferLayout.u8('liquidationPaused'),
    ],
    'config',
  ),

  BufferLayout.struct(
    [
      Port.publicKey('unCollSupply'),
      Port.BigField.forType(Port.BigType.U128, 'lTokenMiningIndex'),
      Port.BigField.forType(Port.BigType.U128, 'borrowMiningIndex'),
      Port.BigField.forType(Port.BigType.U64, 'totalMiningSpeed'),
      Port.BigField.forType(Port.BigType.U64, 'kinkUtilRate'),
    ],
    'bonus',
  ),

  BufferLayout.u8('reentry'),
  Port.BigField.forType(Port.BigType.U64, 'depositLimit'),
  BufferLayout.u8('isLP'),
  BufferLayout.blob(239, 'padding'),
])

// @todo: Ask them for a public npm SDK and a way for passing our connection as argument
// and obtaining all reserves, cause they have it currently hardcoded on their api project
// @note: https://github.com/ProjectLarix/larix-api-server/blob/4025ae358051213871bb8c0247973f91a5fa09e0/src/sdk/constants/config.js#L34
// @note: https://github.com/ProjectLarix/larix-api-server/blob/main/src/main/market.js#L28
// @note: We are using the port sdk monkey patching things, like reserve extra configuration and ReserveLayout which are different from port

const { TOKEN_PROGRAM_ID_PK } = constants
const LARIX_PROGRAM_ID_PK = new PublicKey(ACCOUNT_MAP['larix'].program)
const LARIX_MAIN_MARKET_PROGRAM_ID_PK = new PublicKey(
  ACCOUNT_MAP['larix'].mainMarket,
)

const larixProfile = new Environment(
  ENV.MainnetBeta,
  LARIX_PROGRAM_ID_PK,
  LARIX_PROGRAM_ID_PK,
  TOKEN_PROGRAM_ID_PK,
  [],
)

const SDK: PortInstance & { reserveSymbolMap: ReserveSymbolMap } =
  new PortInstance(
    solanaPrivateRPC.getConnection(),
    larixProfile,
    LARIX_MAIN_MARKET_PROGRAM_ID_PK,
  ) as LarixSDK

// @note: Reuse Port SDK to get larix reserves
SDK.getReserveContext = async function (): Promise<ReserveContext> {
  const rawAccounts = await (this as any).connection.getProgramAccounts(
    LARIX_PROGRAM_ID_PK,
    {
      filters: [
        {
          dataSize: 873,
        },
        {
          memcmp: {
            // eslint-disable-next-line
            offset: ReserveLayout.offsetOf("lendingMarket")!,
            bytes: LARIX_MAIN_MARKET_PROGRAM_ID_PK.toBase58(),
          },
        },
      ],
    },
  )

  const parsed = rawAccounts
    .map((raw: any) => {
      // ReserveInfo.fromRaw(raw)
      const buffer = raw.account.data
      const proto = ReserveLayout.decode(buffer) as ReserveData
      const marketId = MarketId.of(proto.lendingMarket)
      const asset = ReserveAssetInfo.fromRaw(proto.liquidity)
      const token = ReserveTokenInfo.fromRaw(proto.collateral)
      const params = ReserveParams.fromRaw(asset.getMintId(), proto.config)
      const stakingPoolId = proto.config.stakingPoolId

      return new ReserveInfo(
        ReserveId.of(raw.pubkey),
        marketId,
        asset,
        token,
        params,
        stakingPoolId,
        proto,
      )
    })
    .filter((p: any) => !!p)

  return ReserveContext.index(parsed)
}

const baseLogoURI =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/'

const SOLAddress = `${baseLogoURI}/So11111111111111111111111111111111111111112/logo.png`
const USDCAddress = `${baseLogoURI}/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png`
const USDTAddress = `${baseLogoURI}/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg`
const RAYAddress = `${baseLogoURI}/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png`
const soETHAddress = `${baseLogoURI}/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png`
const mSOLAddress = `${baseLogoURI}/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png`

SDK.reserveSymbolMap = {
  // Multi logo LPs

  // SOL-USDC
  '8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu': {
    logoURI: [SOLAddress, USDCAddress].join(','),
  },

  // SOL-USDT
  Epm4KfTj4DMrvqn6Bwg2Tr2N8vhQuNbuK8bESFp4k33K: {
    logoURI: [SOLAddress, USDTAddress].join(','),
  },

  // RAY-SOL
  '89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip': {
    logoURI: [RAYAddress, SOLAddress].join(','),
  },

  // RAY-USDC
  FbC6K13MzHvN42bXrtGaWsvZY9fxrackRSZcBGfjPc7m: {
    logoURI: [RAYAddress, USDCAddress].join(','),
  },

  // RAY-ETH
  mjQH33MqZv5aKAbKHi8dG3g3qXeRQqq1GFcXceZkNSr: {
    logoURI: [RAYAddress, soETHAddress].join(','),
  },

  // RAY-USDT
  '43rjwD7obASwjPjCvG8W1vUjkwhAbA95zc2eMa5itDKq': {
    logoURI: [RAYAddress, USDTAddress].join(','),
  },

  // Custom Unknown LPs

  // mSOL-USDT
  '69NCmEW9mGpiWLjAcAWHq51k4ionJZmzgRfRT3wQaCCf': {
    symbol: 'mSOL-USDT',
    name: 'mSOL-USDT LP Token',
    logoURI: [mSOLAddress, USDTAddress].join(','),
  },

  // mSOL-USDC
  '4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf': {
    symbol: 'mSOL-USDC',
    name: 'mSOL-USDC LP Token',
    logoURI: [mSOLAddress, USDCAddress].join(','),
  },

  // ETH-SOL
  '3hbozt2Por7bcrGod8N7kEeJNMocFFjCJrQR16TQGBrE': {
    symbol: 'ETH-SOL',
    name: 'weWETH-SOL LP Token',
    logoURI: [soETHAddress, SOLAddress].join(','),
  },

  // ETH-USDC
  '3529SBnMCDW3S3xQ52aABbRHo7PcHvpQA4no8J12L5eK': {
    symbol: 'ETH-USDC',
    name: 'weWETH-USDC LP Token',
    logoURI: [soETHAddress, USDCAddress].join(','),
  },
}

export const LARIX_SDK = SDK
