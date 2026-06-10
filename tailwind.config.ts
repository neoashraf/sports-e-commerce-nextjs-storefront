// token source: docs/design/design-files/tokens/{colors,typography,fonts,spacing,base}.css
// SportsVault final design system (volt/cyan/ink). Editorial ink+white canvas with
// neon accents used in punches only — CTAs, badges, focus rings, hover/active.
// Contrast rule: text/icons ON volt or cyan are ALWAYS ink (#0F1115), never white.
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
        // ---- Brand: Ink (text, dark surfaces) ----
        ink: {
          DEFAULT: "#0F1115",
          900: "#0F1115",
          700: "#2A2E37",
          500: "#5B616E",
        },
        // ---- Brand: Volt (primary accent / CTA) ----
        volt: {
          DEFAULT: "#C8FF00",
          600: "#A6D400",
        },
        // ---- Brand: Cyan (secondary accent) ----
        cyan: {
          DEFAULT: "#00E5FF",
          600: "#00B8CC",
        },
        // ---- Neutrals: surfaces & lines ----
        surface: {
          50: "#F7F8FA",
          100: "#EFF1F4",
        },
        border: {
          DEFAULT: "#E2E5EA",
          strong: "#C7CCD4",
        },
        // ---- Text aliases (color-* utilities) ----
        text: {
          DEFAULT: "#0F1115",
          muted: "#5B616E",
          faint: "#8A909C",
          inverse: "#FFFFFF",
          "on-accent": "#0F1115",
        },
        // ---- Semantic ----
        success: "#0E9F6E",
        warning: "#F59E0B",
        error: "#E02424",
        info: "#00B8CC",
        sale: "#E11D2A",

        // ---- Compat alias (removed as waves reskin their screens) ----
        // 72 not-yet-reskinned files still reference brand-*; map it to the volt
        // accent + ink scale so the app keeps rendering until each wave migrates.
        // TODO(reskin): delete once no `brand-*` class remains in src/.
        brand: {
          50: "#F7F8FA",
          100: "#EFF1F4",
          500: "#C8FF00",
          600: "#A6D400",
          700: "#0F1115",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        bangla: ["Hind Siliguri", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid scale from typography.css (clamp = mobile -> desktop).
        "display-xl": ["clamp(2.25rem, 1.4rem + 3.6vw, 3.5rem)", { lineHeight: "1.07", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(1.75rem, 1.2rem + 2.4vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h1: ["clamp(1.5rem, 1.25rem + 1.1vw, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h2: ["clamp(1.25rem, 1.05rem + 0.9vw, 1.5rem)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h3: ["1.0625rem", { lineHeight: "1.41" }],
        body: ["0.9375rem", { lineHeight: "1.47" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.38" }],
        label: ["0.8125rem", { lineHeight: "1.23" }],
        price: ["clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)", { lineHeight: "1.3" }],
        "price-struck": ["0.8125rem", { lineHeight: "1.3" }],
      },
      letterSpacing: {
        tight: "-0.02em",
        snug: "-0.01em",
        wide: "0.08em",
      },
      fontWeight: {
        // expose the design weight ramp for utility use
        extrabold: "800",
        black: "900",
      },
      borderRadius: {
        sm: "6px", // inputs, badges
        md: "10px", // cards, buttons
        lg: "16px", // tiles, hero cards
        full: "9999px",
      },
      boxShadow: {
        // Flat default; card shadow appears on hover only.
        card: "0 1px 2px rgba(15,17,21,.06), 0 1px 3px rgba(15,17,21,.10)",
        "card-hover": "0 4px 10px rgba(15,17,21,.08), 0 2px 4px rgba(15,17,21,.10)",
        pop: "0 8px 28px rgba(15,17,21,.14)",
      },
      spacing: {
        // 4px-base extensions used by section rhythm / control heights.
        14: "56px",
        18: "72px",
        24: "96px",
        "section-y": "40px",
        "section-y-lg": "72px",
        "control-sm": "36px",
        "control-md": "44px",
        "control-lg": "52px",
      },
      maxWidth: {
        container: "1280px", // = max-w-7xl
      },
      ringColor: {
        DEFAULT: "#C8FF00", // volt focus ring
      },
      ringWidth: {
        DEFAULT: "2px",
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionDuration: {
        micro: "150ms",
        ui: "220ms",
        slow: "300ms",
      },
      keyframes: {
        slideUp: {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        pulseOnce: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "slide-up": "slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        shake: "shake 200ms cubic-bezier(0.2, 0, 0, 1)",
        "pulse-once": "pulseOnce 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
