"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, Users, Car, FileText, LayoutDashboard, Receipt, Settings, UserCheck, Package, LogOut, Shield } from "lucide-react";
import { logout } from "@/actions/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/v/") || pathname.startsWith("/login")) {
    return null;
  }

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Vehículos", href: "/vehiculos", icon: Car },
    { name: "Reparaciones", href: "/reparaciones", icon: Wrench },
    { name: "Mecánicos", href: "/mecanicos", icon: UserCheck },
    { name: "Presupuestos", href: "/presupuestos", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Facturación", href: "/facturacion", icon: Receipt },
  ];

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-zinc-950 text-zinc-50 shrink-0">
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800 px-4 hover:bg-zinc-900/50 transition-colors"
      >
        <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
          <Image
            src="/logotaller.webp"
            alt="Logo Taller Mecánico San Luis"
            width={44}
            height={55}
            className="h-11 w-auto object-contain drop-shadow"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-wider text-zinc-100 uppercase truncate">
            San Luis
          </span>
          <span className="text-[10px] text-zinc-400 font-medium tracking-tight truncate">
            Taller Mecánico
          </span>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {links.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-50 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-50"
              }`}
            >
              <link.icon
                className={`mr-3 h-5 w-5 shrink-0 transition-colors ${
                  isActive ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-3 space-y-2">
        <Link
          href="/configuracion"
          className={`group flex items-center rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            pathname.startsWith("/configuracion")
              ? "bg-zinc-800 text-zinc-50 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-50"
          }`}
        >
          <Settings
            className={`mr-2.5 h-4 w-4 shrink-0 transition-colors ${
              pathname.startsWith("/configuracion") ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"
            }`}
          />
          Configuración
        </Link>

        {/* Perfil Administrador y Cerrar Sesión */}
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800/80 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">Administrador</p>
              <p className="text-[10px] text-emerald-400/90 leading-tight">Acceso Total</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
              router.refresh();
            }}
            title="Cerrar Sesión"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
