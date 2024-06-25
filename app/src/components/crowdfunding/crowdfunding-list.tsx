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

  if (!crowdfundingsQuery.data || crowdfundingsQuery.isError) {
    return (
      <div>
        something went wrong
        <pre>{JSON.stringify(crowdfundingsQuery.error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2 py-4">
      {crowdfundingsQuery.data
        .map(address => (
          <li key={address.toString()}>
            <CrowdfundingItem address={address} />
          </li>
        ))}
    </ul>
  )
}
