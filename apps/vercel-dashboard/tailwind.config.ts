import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        panel: "#ffffff",
        line: "#d9deea",
        accent: "#256f8f",
        success: "#277a4f",
        warning: "#a45f13"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
