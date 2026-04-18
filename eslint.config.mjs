// Целевой размер файла — до 400 строк (без пустых строк и однострочных комментариев).
// В ESLint нет авто-разбиения кода: при превышении лимита `yarn lint` падает — нужно вынести модули вручную.
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const maxLinesRule = [
  'error',
  { max: 400, skipBlankLines: true, skipComments: true },
]

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      'dist/**',
      '.output/**',
      'coverage/**',
      'vk-bot/**',
      '*.min.js',
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    rules: { 'max-lines': maxLinesRule },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
  // Временно выше лимита — сокращать постепенно до 400 строк.
  {
    files: [
      'app/composables/useTournamentStandingsRefactored.ts',
      'app/components/organisms/tournament/StepStandingsMatchManagement.vue',
    ],
    rules: {
      'max-lines': [
        'error',
        { max: 620, skipBlankLines: true, skipComments: true },
      ],
    },
  },
)
