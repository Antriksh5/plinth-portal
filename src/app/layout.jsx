import { geistSans, geistMono, poppins, inter } from "../lib/fonts";
import "./globals.css";
import { DataProvider } from "../context/form.context"; // ✅ import your context
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'react-hot-toast';

// Fonts (with CSS variables) are defined in src/lib/fonts.js

// 🏷️ Metadata
export const metadata = {
  title: "Plinth 2027",
  description: "Register for PLINTH 2027, the techno-management fest of LNMIIT Jaipur. Get your PLINTH ID, pick events and form teams.",
};

// 🧩 Root Layout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} antialiased`}
      >
        <DataProvider>
          {children}
          <Toaster />
          <Analytics />
        </DataProvider>
      </body>
    </html>
  );
}
