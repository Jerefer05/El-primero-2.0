import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6E6353",
        text: "#2E2E2E",
        neutral: "#8A887E",
        background: "#d7cbbe",
      },
      fontFamily: {
        serif: ["var(--font-prata)", "serif"],
        sans: ["var(--font-quicksand)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(110, 99, 83, 0.08)",
        whisper: "0 4px 20px rgba(110, 99, 83, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
