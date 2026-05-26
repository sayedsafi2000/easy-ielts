import type { Config } from "tailwindcss";

/**
 * Tailwind config — mirrors the original Learnify-purple palette and
 * exposes the same arbitrary-value colours used inline throughout the app.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#9a72ff",
          deep:  "#8f69f7",
          dark:  "#7a56e0",
          light: "#b798ff",
          soft:  "#efe7ff",
        },
        success:    "#34ba65",
        successBg:  "#dff1e8",
        warning:    "#c89a00",
        warningBg:  "#fff2b3",
        error:      "#ff4d59",
        errorBg:    "#fff0f0",
        ink:        "#222225",
        muted:      "#7b7b8d",
        light:      "#a4a4b5",
        bg:         "#d9d1ff",
        shell:      "#f8f8fb",
        surface:    "#ffffff",
        surfaceSoft:"#f6f7fb",
        sidebar:    "#fafafe",
        border:     "#ececf3",
        borderLight:"#f1f1f7",
        dark:       "#2a292f",
      },
    },
  },
  plugins: [],
};

export default config;
