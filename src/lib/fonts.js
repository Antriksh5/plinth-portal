// Fonts are bundled in src/fonts/ (the exact Latin files Google Fonts serves) so that
// `npm run build` never needs to reach fonts.googleapis.com. A failed font download used to
// break the Vercel build. Same look, no network needed.
import localFont from "next/font/local";

// Orbitron: one variable font file. Each page keeps the exact weight set it used before
// (weights are matched per set, so changing a set changes how bold the text looks).
export const orbitron_400_600_800 = localFont({
  src: [
    { path: "../fonts/orbitron-latin-var.woff2", weight: "400", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "600", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const orbitron_500_700_900 = localFont({
  src: [
    { path: "../fonts/orbitron-latin-var.woff2", weight: "500", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "700", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
});

export const orbitron_400_600_800_900 = localFont({
  src: [
    { path: "../fonts/orbitron-latin-var.woff2", weight: "400", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "600", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "800", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
});

export const orbitron_400_600_700_800 = localFont({
  src: [
    { path: "../fonts/orbitron-latin-var.woff2", weight: "400", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "600", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "700", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const orbitron_700_800 = localFont({
  src: [
    { path: "../fonts/orbitron-latin-var.woff2", weight: "700", style: "normal" },
    { path: "../fonts/orbitron-latin-var.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const geistSans = localFont({
  src: "../fonts/geist-latin-var.woff2",
  weight: "100 900",
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: "../fonts/geist-mono-latin-var.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});

export const inter = localFont({
  src: "../fonts/inter-latin-var.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const poppins = localFont({
  src: [
    { path: "../fonts/poppins-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});
