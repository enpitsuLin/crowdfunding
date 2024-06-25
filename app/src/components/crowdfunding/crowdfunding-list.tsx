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
      const r = await props.contract.getCrowdfundingsMap()
      return r.values()
    },
    initialData: () => [],
    retry: false,
  })

  if (crowdfundingsQuery.isLoading)
    return <div>loading..</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 flex-col gap-2 py-4">
      {crowdfundingsQuery.data
        .map(address => (
          <CrowdfundingItem address={address} key={address.toString()} />
        ))}
    </div>
  )
}
