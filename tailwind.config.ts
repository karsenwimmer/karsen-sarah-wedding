import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/config/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F4EC",
        powder: "#AABBC5",
        matcha: "#A8B18B",
        botanical: "#4D5948",
        ink: "#20201E",
        gold: "#B29A68"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      boxShadow: {
        stationery: "0 24px 70px rgb(32 32 30 / 0.12)"
      }
    }
  },
  plugins: [forms]
};

export default config;
