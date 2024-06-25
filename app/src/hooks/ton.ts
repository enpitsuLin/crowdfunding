import type {
  Sender,
  Transaction,
} from '@ton/ton'
import {
  Address,
  TonClient,
  beginCell,
  storeMessage,
} from '@ton/ton'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
})

export function useTonClient() {
  return useSyncExternalStore(
    () => () => { },
    () => client,
  )
}

export function useAccount() {
  const [TonConnectUI] = useTonConnectUI()
  const [address, setAddress] = useState<Address | null>(null)

  useEffect(() => {
    if (TonConnectUI) {
      if (TonConnectUI.account?.address)
        setAddress(Address.parse(TonConnectUI.account?.address))
      return TonConnectUI.onStatusChange(
        (wallet) => {
          if (wallet?.account.address)
            setAddress(Address.parse(wallet.account.address))
          else setAddress(null)
        },
        () => { },
      )
    }
  }, [TonConnectUI])

  return { address }
}

export function useSender() {
  const [TonConnectUI] = useTonConnectUI()
  const { address } = useAccount()
  const sender = useMemo<Sender>(() => ({
    address: address ?? undefined,
    async send(args) {
      await TonConnectUI.sendTransaction({
        messages: [
          {
            address: args.to.toString(),
            amount: args.value.toString(),
            payload: args.body?.toBoc().toString('base64'),
          },
        ],
        validUntil: Date.now() + 6 * 60 * 1000,
      })
    },
  }), [address, TonConnectUI])
  return sender
}

interface WaitForTransactionOptions {
  address: string
  hash: string
  refetchInterval?: number
  refetchLimit?: number
}

export function useWaitForTransaction(client: TonClient) {
  const waitForTransaction = useCallback(
    async (options: WaitForTransactionOptions): Promise<Transaction | null> => {
      const { hash, refetchInterval = 3000, refetchLimit, address } = options

      return new Promise((resolve) => {
        let refetches = 0
        const walletAddress = Address.parse(address)
        const interval = setInterval(async () => {
          refetches += 1

          // eslint-disable-next-line no-console
          console.log('waiting transaction...')
          const state = await client.getContractState(walletAddress)
          if (!state || !state.lastTransaction) {
            clearInterval(interval)
            resolve(null)
            return
          }
          const lastLt = state.lastTransaction.lt
          const lastHash = state.lastTransaction.hash
          const lastTx = await client.getTransaction(
            walletAddress,
            lastLt,
            lastHash,
          )

          if (lastTx && lastTx.inMessage) {
            const msgCell = beginCell()
              .store(storeMessage(lastTx.inMessage))
              .endCell()

            const inMsgHash = msgCell.hash().toString('base64')
            // eslint-disable-next-line no-console
            console.log('InMsgHash', inMsgHash)
            if (inMsgHash === hash) {
              clearInterval(interval)
              resolve(lastTx)
            }
          }
          if (refetchLimit && refetches >= refetchLimit) {
            clearInterval(interval)
            resolve(null)
          }
        }, refetchInterval)
      })
    },
    [client],
  )

  return { waitForTransaction }
}
