import { TonConnectButton } from '@tonconnect/ui-react'
import { CrowdfundingStartDialog } from '~/components/crowdfunding/crowdfunding-start-dialog'

export function Header() {
  return (
    <header className="sticky left-0 right-0 top-0 flex items-center p-4 z-100">
      <CrowdfundingStartDialog />
      <TonConnectButton className="ml-2" />
    </header>
  )
}
