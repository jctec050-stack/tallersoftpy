import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Taller Mecánico San Luis",
  description: "Sistema de administración operativa para talleres",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-zinc-50">
      <body className={`${inter.className} flex flex-col md:flex-row h-full overflow-hidden antialiased text-zinc-900`}>
        <Sidebar />
        <MobileNav />
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
