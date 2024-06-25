import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { Address } from '@ton/ton'
import { CrowdfundindList } from './crowdfunding/crowdfunding-list'
import { CrowdfundingStartForm } from './crowdfunding/crowdfunding-start-form'
import { useContract } from '~/hooks/contract'

const factoryContractAddress = Address.parse('EQCpq-jeDWQDjZWYAfqeLJVOms26-2o4GRXX5an35tFqgkZK')

export function Body() {
  const contract = useContract(CrowdfundingFactoryContract.CrowdfundingFactory, factoryContractAddress)

  return (
    <main className="container mx-auto md:px-lg pb-20 px-4">
      <CrowdfundingStartForm contract={contract} />
      <CrowdfundindList contract={contract} />
    </main>
  )
}
