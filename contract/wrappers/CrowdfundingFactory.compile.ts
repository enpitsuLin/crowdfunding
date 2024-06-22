import type { CompilerConfig } from '@ton/blueprint'

export const compile: CompilerConfig = {
  lang: 'tact',
  target: 'contracts/crowdfunding_factory.tact',
  options: {
    debug: true,
  },
}
