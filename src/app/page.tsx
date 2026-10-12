export default function DashboardPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Panel Principal</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumen operativo del Taller Mecánico San Luis.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">OTs Activas</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">12</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Vehículos en Taller</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">8</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500">Presupuestos Pendientes</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">3</p>
        </div>
      </div>
    </div>
  );
}
