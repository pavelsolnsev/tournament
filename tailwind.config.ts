import type { Config } from 'tailwindcss'

export default {
  // Hover только на устройствах с настоящим hover (мышь/трекпад). На таче классы hover: не применяются.
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Тема управляется классом 'dark' на <html> — так мы можем переключать вручную.
  // Вариант '.dark &' даёт обычный селектор «.dark .dark:x» вместо «:is(.dark *)»:
  // старый Safari (iOS 12–13) не знает :is() и выкидывал всю тёмную тему — экран становился серым.
  darkMode: ['variant', '.dark &'],
  // Без переменных прозрачности Tailwind пишет цвета обычным #hex вместо «rgb(1 2 3 / var(...))».
  // Safari 10 (iPad 4, iOS 10.3) такую запись не понимает и терял все цвета. Классы bg-opacity-* в проекте не используются.
  corePlugins: {
    backgroundOpacity: false,
    textOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
  },
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      keyframes: {
        /** Полоска ожидания «Скоро обновим статус ВК…» (панель vk-status). */
        vkStatusSheen: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        vkStatusSheen: 'vkStatusSheen 2.2s ease-in-out infinite',
      },
      // Плавный переход для всех цветов при смене темы — избегаем резких вспышек.
      transitionProperty: {
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      // Светлая тема держит свои значения в :root. В html.dark те же --slate-* становятся палитрой fit.
      // rgba(var(), alpha) понимает старый Safari; переключение темы не требует пересборки классов.
      colors: {
        slate: {
          50: 'rgba(var(--slate-50), <alpha-value>)',
          100: 'rgba(var(--slate-100), <alpha-value>)',
          200: 'rgba(var(--slate-200), <alpha-value>)',
          300: 'rgba(var(--slate-300), <alpha-value>)',
          400: 'rgba(var(--slate-400), <alpha-value>)',
          500: 'rgba(var(--slate-500), <alpha-value>)',
          600: 'rgba(var(--slate-600), <alpha-value>)',
          700: 'rgba(var(--slate-700), <alpha-value>)',
          800: 'rgba(var(--slate-800), <alpha-value>)',
          900: 'rgba(var(--slate-900), <alpha-value>)',
          950: 'rgba(var(--slate-950), <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

