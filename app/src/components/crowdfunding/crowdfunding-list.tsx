import type { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { useQuery } from '@tanstack/react-query'
import type { OpenedContract } from '@ton/ton'
import { CrowdfundingItem } from './crowdfunding-item'

export interface CrowdfundindListProps {
  contract: OpenedContract<CrowdfundingFactoryContract.CrowdfundingFactory>
}

export function CrowdfundindList(props: CrowdfundindListProps) {
  const crowdfundingsQuery = useQuery({
    queryKey: ['crowdfunding-list', props.contract.address.toString()],
    queryFn: async () => {
      return props.contract.getCrowdfundingsMap()
        .then(r => r.values())
    },
    initialData: () => [],
  })

  if (crowdfundingsQuery.isLoading)
    return <div>loading..</div>

  if (!crowdfundingsQuery.data || crowdfundingsQuery.isError)
    return <div>something went wrong</div>

  return crowdfundingsQuery.data
    .map(address => (
      <CrowdfundingItem address={address} key={address.toString()} />
    ))
}
