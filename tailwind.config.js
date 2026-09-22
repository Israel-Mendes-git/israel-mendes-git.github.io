/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Paleta "Guilda": preto quente, ouro envelhecido e selo de cera.
      // Substitui o verde neon genérico da versão anterior.
      colors: {
        breu: '#0B0A09',
        piche: '#141210',
        cinza: '#1D1917',
        borda: '#2E2822',
        tinta: '#EDE6DA',
        bruma: '#9A9086',
        ouro: {
          DEFAULT: '#E0A64B',
          claro: '#F4CE86',
          fundo: '#3A2A12',
        },
        musgo: '#7D9A63',
        selo: '#C0492F',
        corrupcao: '#8B6BB1',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        carta: '0 20px 45px -15px rgba(0,0,0,.85)',
        ouro: '0 0 30px -6px rgba(224,166,75,.35)',
      },
      keyframes: {
        subir: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
        piscar: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
      animation: {
        subir: 'subir .7s cubic-bezier(.22,1,.36,1) both',
        piscar: 'piscar 1.1s step-end infinite',
      },
    },
  },
  plugins: [],
}
