/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zora: {
          bg: "#09090b",
          card: "#121217",
          border: "#23232c",
          primary: "#8b5cf6",
          accent: "#ec4899",
          gold: "#f59e0b",
          dark: "#050507",
        }
      },
      backgroundImage: {
        'zora-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'zora-dark-gradient': 'linear-gradient(180deg, rgba(9, 9, 11, 0) 0%, rgba(9, 9, 11, 1) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(236, 72, 153, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};
