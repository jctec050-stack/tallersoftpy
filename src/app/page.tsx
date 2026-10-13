import { getRepairs } from "@/actions/repairs"
import { getVehicles } from "@/actions/vehicles"
import { getClients } from "@/actions/clients"
import { getMechanics } from "@/actions/mechanics"
import { getInventoryItems } from "@/actions/inventory"
import { RepairForm } from "@/components/forms/RepairForm"
import { ClientForm } from "@/components/forms/ClientForm"
import { RepairStatusSelect } from "@/components/repairs/RepairStatusSelect"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import Link from "next/link"
import {
  Wrench,
  Car,
  Users,
  UserCheck,
  Package,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Phone,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Receipt
} from "lucide-react"

export default async function DashboardPage() {
  // Fetch real data in parallel
  const [repairsRes, vehiclesRes, clientsRes, mechanicsRes, inventoryRes] = await Promise.all([
    getRepairs(),
    getVehicles(),
    getClients(),
    getMechanics(),
    getInventoryItems(),
  ])

  const repairs = repairsRes.repairs || []
  const vehicles = vehiclesRes.vehicles || []
  const clients = clientsRes.clients || []
  const mechanics = mechanicsRes.mechanics || []
  const inventoryItems = inventoryRes.items || []

  // Metrics calculation
  const activeRepairs = repairs.filter(r => r.status !== "Entregado")
  const inRepairCount = repairs.filter(r => r.status === "En Reparación").length
  const inDiagCount = repairs.filter(r => r.status === "En Diagnóstico").length
  const completedCount = repairs.filter(r => r.status === "Completado").length
  const pendingCount = repairs.filter(r => r.status === "Pendiente").length

  const pendingBudgets = repairs.filter(r => !r.budget_status || r.budget_status === "Pendiente" || r.budget_status === "Borrador" || r.budget_status === "Enviado")
  const highPriorityActive = activeRepairs.filter(r => r.priority === "Alta")

  const totalBilled = repairs.reduce((acc, r) => acc + (r.budget_total || 0), 0)
  const totalCollected = repairs
    .filter(r => r.status === "Entregado" || r.budget_status === "Entregado")
    .reduce((acc, r) => acc + (r.budget_total || 0), 0)

  const lowStockItems = inventoryItems.filter(i => (i.stock || 0) <= (i.min_stock || 3))
  const activeMechanics = mechanics.filter(m => m.status === "Activo")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 font-semibold text-xs">🔴 Alta</Badge>
      case "Media":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold text-xs">🟡 Media</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs">🟢 Baja</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">✅ Listo</Badge>
      case "En Reparación":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">⚙️ Reparando</Badge>
      case "Presupuestado":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">💰 Cotizado</Badge>
      case "En Diagnóstico":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">🔍 Diagnóstico</Badge>
      case "Entregado":
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 text-xs">🚗 Entregado</Badge>
      default:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-xs">⏳ Pendiente</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Panel Principal</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Operativo En Vivo
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Resumen general y control operativo del Taller Mecánico San Luis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" className="w-full sm:w-auto border-zinc-300 text-zinc-700 hover:bg-zinc-100 shadow-sm" />}>
              <Users className="mr-2 h-4 w-4" /> Nuevo Cliente
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Orden de Trabajo
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Orden de Reparación</DialogTitle>
              </DialogHeader>
              <RepairForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Database Setup Notice if any table has connection error */}
      {(repairsRes.error || vehiclesRes.error || clientsRes.error) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Estado de sincronización con base de datos</p>
            <p className="text-amber-700 text-xs">
              {repairsRes.error || vehiclesRes.error || clientsRes.error}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: OTs Activas */}
        <Link href="/reparaciones" className="group">
          <Card className="border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">OTs en Taller</p>
                  <h3 className="text-3xl font-bold text-zinc-900 mt-1">{activeRepairs.length}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    <span className="font-semibold text-blue-600">{inRepairCount}</span> en proceso · <span className="font-semibold text-amber-600">{inDiagCount}</span> en diag.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Vehículos Registrados */}
        <Link href="/vehiculos" className="group">
          <Card className="border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Parque de Vehículos</p>
                  <h3 className="text-3xl font-bold text-zinc-900 mt-1">{vehicles.length}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    <span className="font-semibold text-zinc-800">{clients.length}</span> clientes registrados
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:scale-105 transition-transform">
                  <Car className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Presupuestos por Responder */}
        <Link href="/presupuestos" className="group">
          <Card className="border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Presupuestos Pendientes</p>
                  <h3 className="text-3xl font-bold text-amber-700 mt-1">{pendingBudgets.length}</h3>
                  <p className="text-xs text-amber-600/80 mt-1">
                    Requieren respuesta de cliente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Total Cobrado / Entregado */}
        <Link href="/cobranzas" className="group">
          <Card className="border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Cobrado</p>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCollected)}</h3>
                  <p className="text-xs text-emerald-600/80 mt-1">
                    Facturado: {formatCurrency(totalBilled)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Recent Active Orders & Workshop Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Órdenes de Trabajo en Curso */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Órdenes de Trabajo en Taller</h2>
                <p className="text-xs text-zinc-500">Reparaciones activas ingresadas y en proceso de atención.</p>
              </div>
              <Link
                href="/reparaciones"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Ver todas ({repairs.length})
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-zinc-100 p-3 space-y-3">
              {activeRepairs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No hay reparaciones en curso en este momento.
                </div>
              ) : (
                activeRepairs.slice(0, 6).map((repair: any) => {
                  const client = repair.vehicle?.client
                  const vehicle = repair.vehicle
                  return (
                    <div key={repair.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                              {vehicle?.plate || "S/C"}
                            </Badge>
                            <span className="font-bold text-zinc-900 text-sm">
                              {vehicle?.brand} {vehicle?.model}
                            </span>
                          </div>
                          {client && (
                            <span className="text-xs text-zinc-500 block mt-0.5">👤 {client.name}</span>
                          )}
                        </div>
                        {getPriorityBadge(repair.priority)}
                      </div>

                      <p className="text-xs text-zinc-600 line-clamp-1">{repair.reason}</p>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <RepairStatusSelect repairId={repair.id} currentStatus={repair.status} variant="badge" />
                        <Link
                          href={`/reparaciones/${repair.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200"
                        >
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead>Vehículo / Chapa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRepairs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        No hay reparaciones en curso en este momento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeRepairs.slice(0, 7).map((repair: any) => {
                      const client = repair.vehicle?.client
                      const vehicle = repair.vehicle

                      return (
                        <TableRow key={repair.id} className="hover:bg-zinc-50/60 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900 text-sm">
                                {vehicle?.brand} {vehicle?.model}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono">
                                {vehicle?.plate || "Sin chapa"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-800">
                                {client?.name || "Sin cliente"}
                              </span>
                              {client?.phone && (
                                <a
                                  href={generateWhatsAppLink(client.phone, `Hola ${client.name}, le saludamos de Taller San Luis sobre su vehículo ${vehicle?.brand} ${vehicle?.model}.`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="h-2.5 w-2.5" />
                                  {client.phone}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-zinc-700 max-w-[200px] truncate block" title={repair.reason}>
                              {repair.reason}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(repair.priority)}
                          </TableCell>
                          <TableCell>
                            <RepairStatusSelect repairId={repair.id} currentStatus={repair.status} variant="badge" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/reparaciones/${repair.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
                            >
                              Ver
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Banner de Urgencias si hay OTs de alta prioridad */}
          {highPriorityActive.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <span className="font-bold">Atención prioritaria requerida:</span> Hay{" "}
                <span className="font-bold">{highPriorityActive.length} orden(es)</span> marcadas con{" "}
                <span className="font-bold">Prioridad Alta</span> que requieren atención inmediata en el taller.
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Workshop Status, Inventory Alerts & Team */}
        <div className="space-y-6">
          {/* Card: Distribución de Estados del Taller */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-500" /> Estado de la Operación
              </CardTitle>
              <CardDescription className="text-xs">Distribución de vehículos en el taller</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" /> Pendientes de ingreso
                </span>
                <span className="font-semibold text-zinc-900">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> En Diagnóstico
                </span>
                <span className="font-semibold text-zinc-900">{inDiagCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> En Reparación
                </span>
                <span className="font-semibold text-zinc-900">{inRepairCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Listos para entrega
                </span>
                <span className="font-semibold text-zinc-900">{completedCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card: Alerta de Inventario de Repuestos */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-zinc-500" /> Control de Stock
                </CardTitle>
                <Link href="/inventario" className="text-xs text-blue-600 hover:underline">
                  Ver inventario
                </Link>
              </div>
              <CardDescription className="text-xs">Repuestos que requieren reposición</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-center text-xs text-emerald-800">
                  ✅ Todos los repuestos cuentan con stock suficiente.
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs">
                      <div>
                        <p className="font-semibold text-amber-900">{item.name}</p>
                        <p className="text-[11px] text-amber-700">Mínimo: {item.min_stock || 3} un.</p>
                      </div>
                      <Badge className="bg-amber-200 text-amber-900 font-bold border-amber-300">
                        {item.stock} disponibles
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 4 && (
                    <p className="text-[11px] text-zinc-500 text-center pt-1">
                      +{lowStockItems.length - 4} repuestos más con stock bajo
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Equipo de Mecánicos Activos */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-zinc-500" /> Equipo de Mecánicos
                </CardTitle>
                <Link href="/mecanicos" className="text-xs text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <CardDescription className="text-xs">Especialistas disponibles en el taller</CardDescription>
            </CardHeader>
            <CardContent>
              {activeMechanics.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No hay mecánicos registrados.</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {activeMechanics.slice(0, 5).map((m: any) => {
                    const assignedRepairsCount = activeRepairs.filter((r: any) => r.mechanic_id === m.id).length
                    return (
                      <div key={m.id} className="py-2 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
                        <div>
                          <p className="font-medium text-zinc-900">{m.name}</p>
                          <p className="text-[11px] text-zinc-500">{m.specialty || "Mecánica general"}</p>
                        </div>
                        <Badge variant="outline" className="text-zinc-600 bg-zinc-50">
                          {assignedRepairsCount} {assignedRepairsCount === 1 ? "orden" : "órdenes"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
