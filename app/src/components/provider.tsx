import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import type { PropsWithChildren } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()
export function AppProvider({ children }: PropsWithChildren) {
  return (
    <TonConnectUIProvider
      manifestUrl="https://gist.githubusercontent.com/enpitsuLin/8edf3874794dafa01d5f64c5578faf7a/raw/tonconnect-manifest.json"
    >
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        {children}
      </QueryClientProvider>
    </TonConnectUIProvider>
  )
}
