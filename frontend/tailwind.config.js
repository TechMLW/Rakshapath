/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rp: {
          bg: "#121415",
          low: "#1a1c1d",
          surface: "#1e2021",
          high: "#282a2b",
          highest: "#333536",
          text: "#e2e2e3",
          muted: "#c8c6ca",
          outline: "#919095",
          blue: "#aec6ff",
          blueStrong: "#0566d9",
          green: "#4edea3",
          red: "#ffb4ab",
          redStrong: "#93000a"
        }
      },
      fontFamily: { inter: ["Inter", "sans-serif"] }
    }
  },
  plugins: []
};