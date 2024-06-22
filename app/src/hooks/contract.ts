import type { Address, Contract, OpenedContract } from '@ton/ton'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import { useTonClient } from './ton'

const contractCache = new WeakMap<Contract, OpenedContract<Contract>>()

interface CompliedContract<C extends Contract> {
  fromAddress: (address: Address) => C
}

export function useContract<C extends Contract>(
  contract: CompliedContract<C>,
  address: Address,
): OpenedContract<C> {
  const listeners = useRef(new Set<() => void>())
  const client = useTonClient()

  const storeContract = useMemo(() => contract.fromAddress(address), [contract, address])

  return useSyncExternalStore(
    (listener) => {
      listeners.current.add(listener)
      return () => {
        listeners.current.delete(listener)
      }
    },
    () => {
      if (contractCache.has(storeContract))
        return contractCache.get(storeContract)! as OpenedContract<C>
      contractCache.set(storeContract, client.open(storeContract))
      return contractCache.get(storeContract)! as OpenedContract<C>
    },
    () => {
      return null as any
    },
  )
}
