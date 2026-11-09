/** Colours are RGB CSS-variable tokens so light/dark themes switch by variables only. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'), surface: token('surface'), sunken: token('sunken'),
        fg: token('fg'), muted: token('muted'), faint: token('faint'), line: token('line'),
        navy: token('navy'), 'navy-soft': token('navy-soft'), 'navy-ink': token('navy-ink'),
        teal: token('teal'), 'teal-soft': token('teal-soft'), 'teal-ink': token('teal-ink'),
        // "brand" is the action colour (navy); older components keep using these names
        brand: token('navy'), 'brand-fg': token('navy-ink'), 'brand-soft': token('navy-soft'),
        ok: token('ok'), 'ok-soft': token('ok-soft'), warn: token('warn'), 'warn-soft': token('warn-soft'),
        bad: token('bad'), 'bad-soft': token('bad-soft'), info: token('info'), 'info-soft': token('info-soft'),
      },
      fontFamily: { sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'], mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'] },
      borderRadius: { card: '14px' },
      boxShadow: { card: '0 1px 2px rgb(15 23 42 / .04), 0 2px 8px rgb(15 23 42 / .04)' },
    },
  },
  plugins: [],
};
