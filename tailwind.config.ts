import type { Config } from 'tailwindcss'

export default {
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
    },
  },
  plugins: [],
} satisfies Config

