import { toNano } from '@ton/core'
import type { SandboxContract, TreasuryContract } from '@ton/sandbox'
import { Blockchain } from '@ton/sandbox'
import { beforeEach, describe, expect, it } from 'vitest'

import { CrowdfundingFactory } from '../wrappers/CrowdfundingFactory'
import { getUnixTimestampNow } from './utils'

import './fixtures'

const MIN_VALUE_TO_START = toNano('1')
const MAX_DEADLINE = 365 * 24 * 60 * 60
const ONE_DAY: number = 1 * 24 * 60 * 60

describe('crowdfundingFactory', () => {
  let blockchain: Blockchain
  let crowdfundingFactory: SandboxContract<CrowdfundingFactory>
  let deployer: SandboxContract<TreasuryContract>

  beforeEach(async () => {
    blockchain = await Blockchain.create()

    deployer = await blockchain.treasury('deployer')

    crowdfundingFactory = blockchain.openContract(await CrowdfundingFactory.fromInit())
    const deployResult = await crowdfundingFactory.send(
      deployer.getSender(),
      {
        value: toNano('0.05'),
      },
      {
        $$type: 'Deploy',
        queryId: 0n,
      },
    )

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: crowdfundingFactory.address,
      deploy: true,
      success: true,
    })
  })

  it('should deploy crowdfunding contract', async () => {
    const result = await startCrowdfunding()
    expect(result.transactions).toHaveTransaction({
      from: crowdfundingFactory.address
    })
  })

  it('increase seqno after creating the crowdfunding', async () => {
    let seqno: bigint = await crowdfundingFactory.getGetLastSeqno()
    expect(seqno).toEqual(0n)

    await startCrowdfunding()

    seqno = await crowdfundingFactory.getGetLastSeqno()
    expect(seqno).toEqual(1n)
  })

  it('don\'t start crowdfunding if value is not enough', async () => {
    await crowdfundingFactory.send(
      deployer.getSender(),
      {
        value: MIN_VALUE_TO_START - toNano('0.01'),
      },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow()),
        beneficiary: deployer.getSender().address,
      },
    )

    const seqno: bigint = await crowdfundingFactory.getGetLastSeqno()
    expect(seqno).toEqual(0n)
  })

  it('don\'t start crowdfunding if deadline is too big', async () => {
    await crowdfundingFactory.send(
      deployer.getSender(),
      {
        value: MIN_VALUE_TO_START,
      },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + MAX_DEADLINE + ONE_DAY),
        beneficiary: deployer.getSender().address,
      },
    )

    const seqno: bigint = await crowdfundingFactory.getGetLastSeqno()
    expect(seqno).toEqual(0n)
  })

  function startCrowdfunding() {
    return crowdfundingFactory.send(
      deployer.getSender(),
      {
        value: MIN_VALUE_TO_START,
      },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + ONE_DAY),
        beneficiary: deployer.getSender().address,
      },
    )
  }
})
