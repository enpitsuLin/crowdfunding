import { toNano } from '@ton/core'
import type { SandboxContract, TreasuryContract } from '@ton/sandbox'
import { Blockchain } from '@ton/sandbox'
import { beforeEach, describe, expect, it } from 'vitest'

import { Crowdfunding } from '../wrappers/Crowdfunding'
import { getUnixTimestampNow } from './utils'

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
          targetContribution: 0n,
          minContribution: 0n,
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
})
