import { Geist, Geist_Mono, Poppins, Inter } from "next/font/google";
import "./globals.css";
import { DataProvider } from "../context/form.context"; // ✅ import your context
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'react-hot-toast';

// 🧠 Load fonts with CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // adjust as needed
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
