import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#01033E",
        electric: "#0033FF",
        lilac: "#817EFF",
        mist: "#D4D6E2",
      },
      fontFamily: {
        sans: ["Inter", "Montserrat", "system-ui", "sans-serif"],
        display: ["Montserrat", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 51, 255, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
