"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname.startsWith("/v/") || pathname.startsWith("/login");

  if (isPublicRoute) {
    return (
      <main className="flex-1 w-full h-full min-h-screen overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <MobileNav />
      <main className="flex-1 overflow-y-auto bg-white pb-28 md:pb-8">
        {children}
      </main>
    </>
  );
}
