import type { Config } from 'tailwindcss'

export default {
  // Hover только на устройствах с настоящим hover (мышь/трекпад). На таче классы hover: не применяются.
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Тема управляется классом 'dark' на <html> — так мы можем переключать вручную.
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      // Плавный переход для всех цветов при смене темы — избегаем резких вспышек.
      transitionProperty: {
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      // Светлая тема: только slate 50–200 (холст и разделители). 300+ не трогаем — иначе меняются dark:border-slate-500, dark:text-slate-500 и т.д.
      colors: {
        slate: {
          50: '#f2f5f8',
          100: '#e6eaef',
          200: '#d5dce5',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

