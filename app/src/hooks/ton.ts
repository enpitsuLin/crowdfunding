import { Address, type Sender, TonClient } from '@ton/ton'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

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
