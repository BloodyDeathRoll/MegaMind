/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Merriweather', 'serif'],
      },
      colors: {
        ink: '#171518',
        mauve: {
          DEFAULT: '#B873AE',
          dim: '#7a4d76',
          glow: 'rgba(184,115,174,0.15)',
        },
        claude: '#E07B39',
        gpt4:   '#10A37F',
        gemini: '#4285F4',
      },
      keyframes: {
        fadein: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' },
        },
      },
      animation: {
        fadein:    'fadein 0.6s ease both',
        pulse_dot: 'pulse_dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
