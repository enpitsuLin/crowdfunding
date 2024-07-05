import { toNano } from '@ton/core'
import type { EventAccountCreated } from '@ton/sandbox'
import { flattenTransaction } from '@ton/test-utils/dist/test/transaction'
import { describe, expect, it } from 'vitest'
import { CrowdfundingFactory } from '../wrappers/CrowdfundingFactory'
import { MAX_DEADLINE, MIN_VALUE_TO_START, ONE_DAY } from './constants'
import { getUnixTimestampNow } from './utils'

import './fixtures'

describe('deploy crowdfundingFactory', () => {
  it('deploy should be success', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await CrowdfundingFactory.fromInit(deployer.address))

    const result = await contract.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy', queryId: 0n },
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
    const contract = blockchain.openContract(await CrowdfundingFactory.fromInit(deployer.address))

    const result = await contract.send(
      deployer.getSender(),
      { value: toNano('0.00001') },
      { $$type: 'Deploy', queryId: 0n },
    )
    expect(result.transactions).not.toHaveTransaction({
      from: deployer.address,
      to: contract.address,
      deploy: true,
      success: true,
    })
  })
})

describe('deploy child crowdfundingCollection contract', () => {
  it('should deploy success', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await CrowdfundingFactory.fromInit(deployer.address))

    // Deploy master contract
    await contract.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy', queryId: 0n },
    )

    const result = await contract.send(
      deployer.getSender(),
      { value: toNano(2) },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + ONE_DAY),
        beneficiary: deployer.address,
      },
    )

    expect(result.transactions).toHaveTransaction({
      from: contract.address,
      deploy: true,
      success: true,
    })

    const createCrowdfundingTx = result.transactions.map(tx => flattenTransaction(tx)).find(tx => tx.from?.equals(contract.address))
    expect(createCrowdfundingTx)

    const createdAccount = result.events.filter((ev): ev is EventAccountCreated => ev.type === 'account_created').map(i => i.account)
    expect(createdAccount).toContainEqual(createCrowdfundingTx?.to)
  })

  it('should deploy fail because not enough funds to start crowdfunding', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await CrowdfundingFactory.fromInit(deployer.address))

    // Deploy master contract
    await contract.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy', queryId: 0n },
    )

    const result = await contract.send(
      deployer.getSender(),
      { value: MIN_VALUE_TO_START - toNano('0.01') },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + ONE_DAY),
        beneficiary: deployer.address,
      },
    )

    const expectExitError = Object.entries(contract.abi.errors ?? {})
      .find(([_code, { message }]) => {
        return message === 'Not enough funds to start crowdfunding'
      })
    expect(expectExitError)
    expect(result.transactions).toHaveTransaction({
      exitCode: Number(expectExitError![0]),
    })
  })

  it('should deploy fail because deadline is too far in the future', async ({ blockchain }) => {
    const deployer = await blockchain.treasury('deployer')
    const contract = blockchain.openContract(await CrowdfundingFactory.fromInit(deployer.address))

    // Deploy master contract
    await contract.send(
      deployer.getSender(),
      { value: toNano('0.05') },
      { $$type: 'Deploy', queryId: 0n },
    )

    const result = await contract.send(
      deployer.getSender(),
      { value: MIN_VALUE_TO_START },
      {
        $$type: 'CrowdfundingParams',
        title: 'Test Title',
        description: 'Test Description',
        minContribution: toNano('0.01'),
        targetContribution: toNano('5'),
        deadline: BigInt(getUnixTimestampNow() + MAX_DEADLINE + ONE_DAY),
        beneficiary: deployer.address,
      },
    )

    const expectExitError = Object.entries(contract.abi.errors ?? {})
      .find(([_code, { message }]) => {
        return message === 'Deadline is too far in the future'
      })
    expect(expectExitError)
    expect(result.transactions).toHaveTransaction({
      exitCode: Number(expectExitError![0]),
    })
  })
})
