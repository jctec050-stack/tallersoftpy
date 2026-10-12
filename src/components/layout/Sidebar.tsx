import Link from "next/link";
import { Wrench, Users, Car, FileText, LayoutDashboard, DollarSign, Settings, UserCheck, Package } from "lucide-react";

export function Sidebar() {
  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reparaciones", href: "/reparaciones", icon: Wrench },
    { name: "Mecánicos", href: "/mecanicos", icon: UserCheck },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Vehículos", href: "/vehiculos", icon: Car },
    { name: "Presupuestos", href: "/presupuestos", icon: FileText },
    { name: "Cobranzas", href: "/cobranzas", icon: DollarSign },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-zinc-950 text-zinc-50">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-zinc-800 px-4">
        <Wrench className="mr-2 h-6 w-6 text-zinc-300" />
        <span className="text-lg font-bold tracking-widest text-zinc-100 uppercase">San Luis</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-colors"
          >
            <link.icon className="mr-3 h-5 w-5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <Link
          href="/configuracion"
          className="group flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 transition-colors"
        >
          <Settings className="mr-3 h-5 w-5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
          Configuración
        </Link>
      </div>
    </div>
  );
}
