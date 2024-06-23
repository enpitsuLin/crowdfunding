import { toNano } from '@ton/core'
import type { EventAccountCreated, SandboxContract, TreasuryContract } from '@ton/sandbox'
import { Blockchain } from '@ton/sandbox'
import { beforeEach, describe, expect, it } from 'vitest'

import { CrowdfundingFactory, CrowdfundingParams } from '../wrappers/CrowdfundingFactory'
import { getUnixTimestampNow } from './utils'

import { flattenTransaction } from '@ton/test-utils/dist/test/transaction'
import './fixtures'
import { extractEvents } from '@ton/sandbox/dist/event/Event'

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
    const result = await startCrowdfunding({
      title: 'Test Title',
      description: 'Test Description',
      minContribution: toNano('0.01'),
      targetContribution: toNano('5'),
      deadline: BigInt(getUnixTimestampNow() + ONE_DAY),
      beneficiary: deployer.getSender().address,
    })
    expect(result.transactions).toHaveTransaction({
      from: crowdfundingFactory.address
    })
  })

  it('don\'t start crowdfunding if value is not enough', async () => {
    const result = await startCrowdfunding({
      title: 'Test Title',
      description: 'Test Description',
      minContribution: toNano('0.01'),
      targetContribution: toNano('5'),
      deadline: BigInt(getUnixTimestampNow()),
      beneficiary: deployer.getSender().address,
    }, MIN_VALUE_TO_START - toNano('0.01'))

    const expectExitError = Object.entries(crowdfundingFactory.abi.errors ?? {})
      .find(([_code, { message }]) => {
        return message == 'Not enough funds to start crowdfunding'
      })
    expect(expectExitError)
    expect(result.transactions).toHaveTransaction({
      exitCode: Number(expectExitError![0])
    })
  })

  it('don\'t start crowdfunding if deadline is too big', async () => {
    const result = await startCrowdfunding({
      title: 'Test Title',
      description: 'Test Description',
      minContribution: toNano('0.01'),
      targetContribution: toNano('5'),
      deadline: BigInt(getUnixTimestampNow() + MAX_DEADLINE + ONE_DAY),
      beneficiary: deployer.getSender().address,
    })

    const expectExitError = Object.entries(crowdfundingFactory.abi.errors ?? {})
      .find(([_code, { message }]) => {
        return message == 'Deadline is too far in the future'
      })
    expect(expectExitError)
    expect(result.transactions).toHaveTransaction({
      exitCode: Number(expectExitError![0])
    })
  })



  it('should get crowdfunding contract address create by sender', async () => {
    const contributor = (await blockchain.createWallets(1)).at(0)!

    const res = await startCrowdfunding(
      {
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + ONE_DAY),
        beneficiary: deployer.getSender().address,
      },
      MIN_VALUE_TO_START,
      contributor.getSender()
    )

    const contractAddress = await crowdfundingFactory.getContractAddress(contributor.address)

    const eventAccountCreated = res.events.find((event): event is EventAccountCreated => event.type === 'account_created')

    expect(eventAccountCreated)
    expect(eventAccountCreated!.account.equals(contractAddress))
  })

  function startCrowdfunding(
    parmas: Omit<CrowdfundingParams, '$$type'>,
    value = MIN_VALUE_TO_START,
    sender = deployer.getSender()
  ) {
    return crowdfundingFactory.send(
      sender,
      { value },
      { $$type: 'CrowdfundingParams', ...parmas },
    )
  }
})
