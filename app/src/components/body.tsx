import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { Address, toNano } from '@ton/ton'
import { useContract } from '~/hooks/contract'
import { useAccount, useSender } from '~/hooks/ton'
import { createCrowdfundingParamsScheme } from '~/scheme'

export function Body() {
  const contract = useContract(
    CrowdfundingFactoryContract.CrowdfundingFactory,
    Address.parse('0QCOe_aTbGyL7qzYA88Vlj-AagVt_FJ_9NNnOFeFq0B-i4zX'),
  )

  const { address } = useAccount()
  const sender = useSender()

  function createCrowdfunding(form: unknown) {
    if (!address)
      return
    const parsedParams = createCrowdfundingParamsScheme.safeParse(form)
    if (parsedParams.success) {
      contract.send(
        sender,
        { value: toNano('0.05') },
        parsedParams.data,
      )
    }
  }

  return (
    <div>
      <button type="button">only a button</button>
    </div>
  )
}
