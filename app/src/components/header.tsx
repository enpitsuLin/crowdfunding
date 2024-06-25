import { TonConnectButton } from '@tonconnect/ui-react'

export function Header() {
  return (
    <header className="sticky left-0 right-0 top-0 flex items-center p-4 z-100">
      <TonConnectButton className="ml-auto" />
    </header>
  )
}
