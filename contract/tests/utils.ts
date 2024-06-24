import type { BlockchainTransaction } from '@ton/sandbox'
import { flattenTransaction } from '@ton/test-utils/dist/test/transaction'

export function getUnixTimestampNow(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * human readable txs
 */
export function normalizeTranscations(txs: BlockchainTransaction[], removeBody = true) {
  const flatten = txs.map(flattenTransaction)
  if (removeBody)
    return flatten.map(({ initCode, initData, body, ...rest }) => rest)
  return flatten
}
