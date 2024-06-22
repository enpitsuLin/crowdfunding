import { TonConnectUIProvider } from '@tonconnect/ui-react'
import type { PropsWithChildren } from 'react'

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <TonConnectUIProvider
      manifestUrl="https://gist.githubusercontent.com/enpitsuLin/8edf3874794dafa01d5f64c5578faf7a/raw/tonconnect-manifest.json"
    >
      {children}
    </TonConnectUIProvider>
  )
}
