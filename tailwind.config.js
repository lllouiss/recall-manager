/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/src/**/*.{ts,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      colors: {
        bg:            '#0f0f0f',
        surface:       '#161616',
        'surface-alt': '#1c1c1c',
        border:        '#2a2a2a',
        'border-lit':  '#3a3a3a',
        accent:        '#e85d04',
        'accent-dim':  '#b84803',
        text:          '#e5e5e5',
        muted:         '#555555',
        success:       '#22c55e',
        error:         '#ef4444',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'sans-serif'],
      }
    }
  },
  plugins: []
}
