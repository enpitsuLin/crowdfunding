import { Body } from '~/components/body'
import { Header } from '~/components/header'
import { AppProvider } from '~/components/provider'

function App() {
  return (
    <AppProvider>
      <Header />
      <Body />
    </AppProvider>
  )
}

export default App
