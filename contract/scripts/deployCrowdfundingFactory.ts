import { toNano } from '@ton/core'
import type { NetworkProvider } from '@ton/blueprint'
import { CrowdfundingFactory } from '../wrappers/CrowdfundingFactory'

export async function run(provider: NetworkProvider) {
  const crowdfundingFactory = provider.open(await CrowdfundingFactory.fromInit())

  await crowdfundingFactory.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  )

  await provider.waitForDeploy(crowdfundingFactory.address)

  // run methods on `crowdfundingFactory`
}
