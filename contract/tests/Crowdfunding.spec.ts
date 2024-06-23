import { Address, fromNano, toNano } from '@ton/core'
import type { SandboxContract, TreasuryContract } from '@ton/sandbox'
import { Blockchain } from '@ton/sandbox'
import { beforeEach, describe, expect, it } from 'vitest'

import { Crowdfunding } from '../wrappers/Crowdfunding'
import { getUnixTimestampNow } from './utils'
import { flattenTransaction } from '@ton/test-utils/dist/test/transaction'

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
    const beforeInfo = await crowdfunding.getInfo()
    const beforeContribution = Number(fromNano(beforeInfo.currentContribution))
    expect(beforeContribution)

    const contributor = blockchain.sender(Address.parse('0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX'))

    const result = await crowdfunding.send(
      contributor,
      { value: toNano('1') },
      'contribute'
    )

    expect(result.transactions).toHaveTransaction({
      from: contributor.address
    })

    expect(result.transactions).toHaveLength(1)

    const flat = flattenTransaction(result.transactions.at(0)!)

    expect(flat.value)
    expect(flat.totalFees)
    expect(fromNano(flat.value!)).toEqual('1')

    const afterInfo = await crowdfunding.getInfo()
    const afterContribution = Number(fromNano(afterInfo.currentContribution))

    expect(fromNano(flat.value! - flat.totalFees! + beforeInfo.currentContribution)).toEqual(fromNano(afterInfo.currentContribution))
    expect(afterContribution).greaterThan(beforeContribution)
  })
})
