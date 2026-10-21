"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Wrench,
  Users,
  Car,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCheck,
  Package,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Evitar scroll cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Vehículos", href: "/vehiculos", icon: Car },
    { name: "Reparaciones", href: "/reparaciones", icon: Wrench },
    { name: "Mecánicos", href: "/mecanicos", icon: UserCheck },
    { name: "Presupuestos", href: "/presupuestos", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Facturación", href: "/facturacion", icon: Receipt },
  ]

  // Atajos rápidos para la barra inferior
  const bottomTabs = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Reparaciones", href: "/reparaciones", icon: Wrench },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Vehículos", href: "/vehiculos", icon: Car },
  ]

  if (pathname.startsWith("/v/")) {
    return null
  }

  return (
    <>
      {/* 1. Header Superior Móvil */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 text-zinc-50 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 flex items-center justify-center">
            <Image
              src="/logotaller.webp"
              alt="Logo Taller San Luis"
              width={36}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider uppercase text-zinc-100">
              San Luis
            </span>
            <span className="text-[10px] text-zinc-400 -mt-0.5">Taller Mecánico</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
          aria-label="Abrir menú"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* 2. Drawer / Menú Lateral Desplegable Móvil */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel Lateral Deslizante */}
          <div className="relative ml-auto flex h-full w-[84vw] max-w-xs flex-col bg-zinc-950 text-zinc-50 shadow-2xl animate-in slide-in-from-right duration-200 overscroll-contain">
            {/* Header del Drawer */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-5">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 shrink-0 flex items-center justify-center">
                  <Image
                    src="/logotaller.webp"
                    alt="Logo Taller San Luis"
                    width={36}
                    height={45}
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wider uppercase text-zinc-100">
                    San Luis
                  </span>
                  <span className="text-[10px] text-zinc-400 -mt-0.5">Taller Mecánico</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Enlaces de Navegación */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white font-semibold shadow-xs"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? "text-zinc-100" : "text-zinc-500"
                        }`}
                      />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </Link>
                )
              })}
            </nav>

            {/* Footer del Drawer */}
            <div className="border-t border-zinc-800 p-4">
              <Link
                href="/configuracion"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                  pathname.startsWith("/configuracion")
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                <Settings className="h-5 w-5 text-zinc-500 shrink-0" />
                Configuración
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Barra Inferior Fija para Móviles (Bottom Navigation Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 pb-[env(safe-area-inset-bottom,0px)] w-full items-center justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-2 text-zinc-50 shadow-lg">
        {bottomTabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  isActive ? "bg-zinc-800 text-zinc-100 scale-105" : "text-zinc-400"
                }`}
              >
                <tab.icon className="h-4 w-4" />
              </div>
              <span className="mt-0.5">{tab.name}</span>
            </Link>
          )
        })}

        {/* Botón Más / Menú completo */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            isOpen ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              isOpen ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"
            }`}
          >
            <Menu className="h-4 w-4" />
          </div>
          <span className="mt-0.5">Más</span>
        </button>
      </nav>
    </>
  )
}
