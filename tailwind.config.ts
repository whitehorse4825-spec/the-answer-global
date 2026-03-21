import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        "danchung-red": "#C53030",
        "danchung-blue": "#2B6CB0",
        "danchung-gold": "#D4AF37",
      },
      fontFamily: {
        eng: [
          "var(--font-eng)",
          "ui-serif",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        ko: [
          "var(--font-ko)",
          "Nanum Myeongjo",
          "serif",
        ],
        jp: ["var(--font-jp)", "ui-serif", "serif"],
      },
    },
  },
};

export default config;

