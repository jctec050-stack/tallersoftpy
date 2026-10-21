import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Taller Mecánico San Luis",
  description: "Sistema de administración operativa para talleres mecánicos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taller San Luis",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/logotaller.webp" },
    ],
    shortcut: "/logotaller.webp",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full min-h-[100dvh] bg-zinc-50">
      <body className={`${inter.className} flex flex-col md:flex-row h-full min-h-[100dvh] overflow-hidden antialiased text-zinc-900`}>
        <Sidebar />
        <MobileNav />
        <main className="flex-1 overflow-y-auto bg-white pb-28 md:pb-8">
          {children}
        </main>
        <PwaRegister />
      </body>
    </html>
  );
}

