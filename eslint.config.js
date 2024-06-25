import { antfu } from '@antfu/eslint-config'

export default antfu(
  {
    react: true,
    ignores: ['contract/build/*'],

  },
  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
)
