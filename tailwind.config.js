/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Paleta verde/preto original do portfólio. Os nomes são semânticos para
      // que trocar de acento seja editar este arquivo, e não caçar classe a classe.
      colors: {
        breu: '#000000',
        piche: '#080808',
        cinza: '#111111',
        borda: '#123321',
        tinta: '#FFFFFF',
        bruma: '#9CA3AF',
        verde: {
          DEFAULT: '#22C55E',
          claro: '#4ADE80',
          escuro: '#16A34A',
          fundo: '#052E16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        verde: '0 0 25px -4px rgba(34,197,94,.30)',
        carta: '0 20px 45px -15px rgba(0,0,0,.85)',
      },
      keyframes: {
        subir: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        subir: 'subir .7s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
}
