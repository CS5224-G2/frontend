/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './index.js',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        secondary: '#64748b',
        border: '#e2e8f0',
        'border-light': '#dbe3f0',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'bg-base': '#ffffff',
        'bg-light': '#f8fbff',
        'bg-page': '#eef4ff',
        'bubble-top': '#d8e6ff',
        'bubble-bottom': '#dbeafe',
      },
      spacing: {
        'cy-xs': '4px',
        'cy-sm': '8px',
        'cy-md': '12px',
        'cy-lg': '16px',
        'cy-xl': '24px',
        'cy-2xl': '32px',
      },
      borderRadius: {
        'cy-sm': '6px',
        'cy-md': '8px',
        'cy-lg': '12px',
        'cy-xl': '16px',
        'cy-2xl': '28px',
      },
    },
  },
  plugins: [],
};
