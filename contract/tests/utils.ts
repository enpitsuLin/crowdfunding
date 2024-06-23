import { Contract } from "@ton/core";
import { Blockchain } from "@ton/sandbox";

export function getUnixTimestampNow(): number {
  return Math.floor(Date.now() / 1000)
}

export async function initContract<C extends Contract, A = C[]>(getContract: () => C | Promise<C>) {
  const blockchain = await Blockchain.create()
  const deployer = await blockchain.treasury('deployer')
  const c = getContract()
  const contract = blockchain.openContract(
    c instanceof Promise ? await c : c
  )

  return {
    blockchain,
    deployer,
    contract
  }
}

export async function initBlockchain() {

}
