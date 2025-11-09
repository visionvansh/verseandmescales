/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-red': 'var(--primary-red)',
        'dark-red': 'var(--dark-red)',
        'light-red': 'var(--light-red)',
        'pure-black': 'var(--pure-black)',
        'dark-gray': 'var(--dark-gray)',
        'medium-gray': 'var(--medium-gray)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};