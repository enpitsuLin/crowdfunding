import { TonConnectButton } from '@tonconnect/ui-react'

export function Header() {
  return (
    <header className='flex items-center p-4 sticky left-0 right-0 top-0'  >
      <TonConnectButton className="ml-auto" />
    </header>
  )
}
