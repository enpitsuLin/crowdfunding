import { CrowdfundingFactoryContract } from '@crowdfunding/contract'
import { Address } from '@ton/core'
import { CrowdfundingStartForm } from './crowdfunding-start-form'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { useContract } from '~/hooks/contract'

const factoryContractAddress = Address.parse('EQCpq-jeDWQDjZWYAfqeLJVOms26-2o4GRXX5an35tFqgkZK')

export function CrowdfundingStartDialog() {
  const contract = useContract(CrowdfundingFactoryContract.CrowdfundingFactory, factoryContractAddress)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto rounded-full shadow-[0_4px_24px_rgba(0,0,0, 0.16)]">
          Create Crowdfunding
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribute to this Project</DialogTitle>
        </DialogHeader>
        <CrowdfundingStartForm contract={contract} />
      </DialogContent>
    </Dialog>
  )
}
