import { Inter, Plus_Jakarta_Sans, Poppins } from "next/font/google";

/** H1 — Plus Jakarta Sans ExtraBold */
export const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["800"],
});

/** H2–H4 — Poppins */
export const fontDisplay = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** H5, body, button — Inter */
export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontConfig = {
  heading: fontHeading,
  display: fontDisplay,
  sans: fontSans,
  variables: {
    heading: "--font-heading",
    display: "--font-display",
    sans: "--font-sans",
  },
  /** All font CSS variables for root layout */
  className: `${fontHeading.variable} ${fontDisplay.variable} ${fontSans.variable}`,
} as const;
