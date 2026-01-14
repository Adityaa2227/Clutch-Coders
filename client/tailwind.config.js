/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F14',
        surface: '#111827', 
        border: '#1F2937',
        primary: {
          DEFAULT: '#3B82F6',
          400: '#60A5FA',
        },
        text: {
            main: '#E5E7EB',
            muted: '#9CA3AF'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444'
      }
    },
  },
  plugins: [],
}
