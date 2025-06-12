// @ts-check

// import eslint from '@eslint/js';
// import tseslint from 'typescript-eslint';

// export default tseslint.config(
//    eslint.configs.recommended,
//    tseslint.configs.recommended,
//);

import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
    },
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  }
]