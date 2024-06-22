import type { CompilerConfig } from '@ton/blueprint'

export const compile: CompilerConfig = {
  lang: 'tact',
  target: 'contracts/crowdfunding.tact',
  options: {
    debug: true,
  },
}
