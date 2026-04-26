export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#030712",
        card: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.1)",
        accent: "#22d3ee",
        accent2: "#a855f7",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(34,211,238,0.2)",
      },
    },
  },
  plugins: [],
}
