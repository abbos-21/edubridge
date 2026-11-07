/** Colours are RGB CSS-variable tokens so light/dark themes switch by variables only. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'), surface: token('surface'), sunken: token('sunken'),
        fg: token('fg'), muted: token('muted'), line: token('line'),
        brand: token('brand'), 'brand-fg': token('brand-fg'), 'brand-soft': token('brand-soft'),
        ok: token('ok'), warn: token('warn'), bad: token('bad'), info: token('info'),
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'], mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'] },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
};
