import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        moss: "#52645e",
        mint: "#d8f4e8",
        saffron: "#f6c453",
        coral: "#ec6f66",
        lavender: "#8974c8"
      },
      boxShadow: {
        panel: "0 12px 32px rgba(23, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
