import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from 'unocss'

import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAnimations(),
    presetShadcn(),
  ],
})
