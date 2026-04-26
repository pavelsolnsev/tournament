// Целевой размер файла — до 400 строк (без пустых строк и однострочных комментариев).
// withNuxt подтягивает глобали автоимпортов из Nuxt (ref, computed, useFetch, …).
import './eslint.polyfill-groupby.mjs'
import withNuxt from './.nuxt/eslint.config.mjs'

const maxLinesRule = [
  'error',
  { max: 400, skipBlankLines: true, skipComments: true },
]

export default withNuxt(
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      'dist/**',
      '.output/**',
      'coverage/**',
      'vk-bot/**',
      'public/**',
      '*.min.js',
    ],
  },
  {
    rules: {
      'max-lines': maxLinesRule,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    files: ['app/pages/index.vue'],
    rules: {
      // Оркестрация мастера, зрителя, синка вкладок и очистки — один входной файл.
      'max-lines': 'off',
    },
  },
)
