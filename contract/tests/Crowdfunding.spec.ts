import { Address, fromNano, toNano } from '@ton/core'
import type { SandboxContract, TreasuryContract } from '@ton/sandbox'
import { Blockchain } from '@ton/sandbox'
import { beforeEach, describe, expect, it } from 'vitest'

import { Crowdfunding } from '../wrappers/Crowdfunding'
import { getUnixTimestampNow } from './utils'
import { compareTransaction, flattenTransaction } from '@ton/test-utils/dist/test/transaction'

import './fixtures'

describe('crowdfunding', () => {
  let blockchain: Blockchain
  let crowdfunding: SandboxContract<Crowdfunding>
  let deployer: SandboxContract<TreasuryContract>

  beforeEach(async () => {
    blockchain = await Blockchain.create()

    deployer = await blockchain.treasury('deployer')

    crowdfunding = blockchain.openContract(await Crowdfunding.fromInit(deployer.getSender().address, 0n))

    const deployResult = await crowdfunding.send(
      deployer.getSender(),
      {
        value: toNano('0.05'),
      },
      {
        $$type: 'StartCrowdfunding',
        creator: deployer.getSender().address,
        params: {
          $$type: 'CrowdfundingParams',
          title: '',
          description: '',
          targetContribution: toNano('10'),
          minContribution: toNano('0.5'),
          deadline: BigInt(getUnixTimestampNow()),
          beneficiary: deployer.getSender().address,
        },
      },
    )

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: crowdfunding.address,
      deploy: true,
      success: true,
    })
  })

  it('should deploy', async () => {
    // the check is done inside beforeEach
    // blockchain and crowdfunding are ready to use

    expect(await crowdfunding.getOwner()).toEqualAddress(deployer.address)
  })

  it('should receive contribute work properly', async () => {
    const contributor = (await blockchain.createWallets(1)).at(0)!

    const beforeInfo = await crowdfunding.getInfo()
    const beforeContribution = Number(fromNano(beforeInfo.currentContribution))
    expect(beforeContribution)

    await crowdfunding.send(contributor.getSender(), { value: toNano('1') }, 'contribute')

    const afterInfo = await crowdfunding.getInfo()
    const afterContribution = Number(fromNano(afterInfo.currentContribution))

    expect(afterContribution).greaterThan(beforeContribution)
  })

  it('balance changes should equals after contributed', async () => {
    const contributor = (await blockchain.createWallets(1)).at(0)!

    const beforeInfo = await crowdfunding.getInfo()

    const beforeBalance = await contributor.getBalance()
    expect(beforeBalance)

    const result = await crowdfunding.send(contributor.getSender(), { value: toNano('1') }, 'contribute')

    expect(result.transactions).toHaveTransaction({ from: contributor.address })

    const afterBalance = await contributor.getBalance()
    expect(afterBalance).toBeLessThan(beforeBalance)

    const flat = flattenTransaction(result.transactions.find(tx => compareTransaction(flattenTransaction(tx), { from: contributor.address }))!)

    expect(flat.value)
    expect(flat.totalFees)
    expect(fromNano(flat.value!)).toEqual('1')

    const afterInfo = await crowdfunding.getInfo()

    expect(fromNano(flat.value! - flat.totalFees! + beforeInfo.currentContribution)).toEqual(fromNano(afterInfo.currentContribution))
  })

  it('deployer can withdraw if contribution reach the goal', async () => {
    const contributor = (await blockchain.createWallets(1)).at(0)!

    await crowdfunding.send(contributor.getSender(), { value: toNano('10') }, 'contribute')
    const info = await crowdfunding.getInfo()

    expect(info.currentContribution).toBeGreaterThan(info.params.targetContribution)

    const beforeWithdrawBalance = await deployer.getBalance()
    const result = await crowdfunding.send(deployer.getSender(), { value: toNano('0.1') }, 'withdraw')
    const afterWithdrawBalance = await deployer.getBalance()

    expect(result.transactions).toHaveTransaction({
      from: crowdfunding.address,
      to: deployer.address
    })
    
    expect(afterWithdrawBalance).toBeGreaterThan(beforeWithdrawBalance)
  })
})
