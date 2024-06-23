import { fromNano, toNano } from '@ton/core'
import { Blockchain } from '@ton/sandbox'
import { compareTransaction, flattenTransaction } from '@ton/test-utils/dist/test/transaction'
import { describe, expect, it, vi } from 'vitest'
import { Crowdfunding } from '../wrappers/Crowdfunding'
import { getUnixTimestampNow } from './utils'

import './fixtures'

describe('Deploy crowdfunding', () => {
  it('deploy should be success', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await Crowdfunding.fromInit(deployer.address, 0n))
    const result = await contract.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      {
        $$type: "StartCrowdfunding",
        creator: deployer.getSender().address,
        params: {
          $$type: "CrowdfundingParams",
          title: '',
          description: '',
          targetContribution: toNano('10'),
          minContribution: toNano('0.5'),
          deadline: BigInt(getUnixTimestampNow()),
          beneficiary: deployer.getSender().address,
        }
      }
    )

    expect(result.transactions).toHaveTransaction({
      from: deployer.address,
      to: contract.address,
      deploy: true,
      success: true,
    })
  })

  it('deploy should be failed when fee too low', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await Crowdfunding.fromInit(deployer.address, 0n))
    const result = await contract.send(
      deployer.getSender(),
      { value: toNano('0.0001') },
      {
        $$type: "StartCrowdfunding",
        creator: deployer.getSender().address,
        params: {
          $$type: "CrowdfundingParams",
          title: '',
          description: '',
          targetContribution: toNano('10'),
          minContribution: toNano('0.5'),
          deadline: BigInt(getUnixTimestampNow()),
          beneficiary: deployer.getSender().address,
        }
      }
    )

    expect(result.transactions).not.toHaveTransaction({
      from: deployer.address,
      to: contract.address,
      deploy: true,
      success: true,
    })
  })
})

describe('Crowdfunding Contribute flow', () => {

  it('receive contribute work properly', async ({ blockchain }) => {
    const contributor = (await blockchain.createWallets(1)).at(0)!
    const { contract } = await createCrowdfundingProject(blockchain)

    const beforeInfo = await contract.getInfo()
    const beforeContribution = Number(fromNano(beforeInfo.currentContribution))
    expect(beforeContribution)

    await contract.send(contributor.getSender(), { value: toNano('1') }, 'contribute')

    const afterInfo = await contract.getInfo()
    const afterContribution = Number(fromNano(afterInfo.currentContribution))

    expect(afterContribution).greaterThan(beforeContribution)
  })

  it('balance changes should equals after contributed', async ({ blockchain }) => {
    const contributor = (await blockchain.createWallets(1)).at(0)!
    const { contract } = await createCrowdfundingProject(blockchain)

    const beforeInfo = await contract.getInfo()

    const beforeBalance = await contributor.getBalance()
    expect(beforeBalance)

    const result = await contract.send(contributor.getSender(), { value: toNano('1') }, 'contribute')

    expect(result.transactions).toHaveTransaction({ from: contributor.address })

    const afterBalance = await contributor.getBalance()
    expect(afterBalance).toBeLessThan(beforeBalance)

    const flat = flattenTransaction(result.transactions.find(tx => compareTransaction(flattenTransaction(tx), { from: contributor.address }))!)

    expect(flat.value)
    expect(flat.totalFees)
    expect(fromNano(flat.value!)).toEqual('1')

    const afterInfo = await contract.getInfo()

    expect(fromNano(flat.value! - flat.totalFees! + beforeInfo.currentContribution)).toEqual(fromNano(afterInfo.currentContribution))
  })


  it('deployer can withdraw if contribution reach the goal', async ({ blockchain }) => {
    const contributor = (await blockchain.createWallets(1)).at(0)!
    const { contract, deployer } = await createCrowdfundingProject(blockchain)

    await contract.send(contributor.getSender(), { value: toNano('10') }, 'contribute')
    const info = await contract.getInfo()

    expect(info.currentContribution).toBeGreaterThan(info.params.targetContribution)

    const beforeWithdrawBalance = await deployer.getBalance()
    const result = await contract.send(deployer.getSender(), { value: toNano('0.1') }, 'withdraw')
    const afterWithdrawBalance = await deployer.getBalance()

    expect(result.transactions).toHaveTransaction({
      from: contract.address,
      to: deployer.address
    })

    expect(afterWithdrawBalance).toBeGreaterThan(beforeWithdrawBalance)
  })

  it.skip('contributor can refund when it get dealine but not reach goal', async ({ blockchain }) => {
    vi.useFakeTimers()
    const contributor = (await blockchain.createWallets(1)).at(0)!
    const { contract } = await createCrowdfundingProject(blockchain)

    const { params: { deadline } } = await contract.getInfo()
    await contract.send(contributor.getSender(), { value: toNano('1') }, 'contribute')

    vi.setSystemTime(new Date((deadline * 1000n).toString()))

    await contract.send(
      contributor.getSender(),
      { value: toNano('1') },
      'refund'
    )
    vi.useRealTimers()
  })
})


async function createCrowdfundingProject(blockchain: Blockchain) {
  const deployer = await blockchain.treasury('deployer')
  const contract = blockchain.openContract(await Crowdfunding.fromInit(deployer.address, 0n))
  await contract.send(
    deployer.getSender(),
    { value: toNano('0.05') },
    {
      $$type: "StartCrowdfunding",
      creator: deployer.getSender().address,
      params: {
        $$type: "CrowdfundingParams",
        title: 'Test Crowdfunding',
        description: 'A test Crowdfunding project',
        targetContribution: toNano('10'),
        minContribution: toNano('0.5'),
        deadline: BigInt(getUnixTimestampNow()),
        beneficiary: deployer.getSender().address,
      }
    }
  )
  return { contract, deployer }
}
