import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Assistant', 'Heebo', 'Arial', 'sans-serif']
      },
      colors: {
        villa: {
          ink: '#090807',
          night: '#11100e',
          panel: '#1b1712',
          gold: '#d7b46a',
          pearl: '#f5efe1',
          mist: '#8f9a9d',
          water: '#7fb7b4',
          sage: '#87946f'
        }
      },
      boxShadow: {
        glass: '0 24px 90px rgba(0, 0, 0, 0.42)',
        glow: '0 0 36px rgba(215, 180, 106, 0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;
