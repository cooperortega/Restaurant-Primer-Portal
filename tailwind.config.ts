import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["Playfair Display", "Georgia", "serif"],
        source: ["Source Sans Pro", "Arial", "sans-serif"],
        montserrat: ["Montserrat", "Arial", "sans-serif"],
      },
      colors: {
        primer: {
          black: "#000000",
          dark: "#161616",
          card: "#0f0f0f",
          border: "#1e1e1e",
          gray: "#969696",
          light: "#e2e2e2",
          gold: "#b8a88a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
