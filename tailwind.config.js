export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        caplyBg: "#030712",
        caplyCard: "rgba(255,255,255,0.06)",
        caplyBorder: "rgba(255,255,255,0.1)",
        caplyAccent: "#22d3ee",
        caplyAccent2: "#a855f7",
      },
      boxShadow: {
        glow: "0 0 40px rgba(34,211,238,0.2)",
      },
    },
  },
  plugins: [],
};
