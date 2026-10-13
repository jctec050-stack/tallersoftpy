import { getRepairs } from "@/actions/repairs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import Link from "next/link"
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Phone, ExternalLink, Car, User, Wallet, Receipt } from "lucide-react"

export default async function CobranzasPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const { repairs, error: fetchError } = await getRepairs(q)

  // Filtrar o calcular totales
  const totalAmount = repairs?.reduce((acc: number, r: any) => acc + (r.budget_total || 0), 0) || 0
  const collectedRepairs = repairs?.filter((r: any) => r.status === "Entregado" || r.budget_status === "Entregado") || []
  const collectedAmount = collectedRepairs.reduce((acc: number, r: any) => acc + (r.budget_total || 0), 0)
  
  const pendingRepairs = repairs?.filter((r: any) => r.status !== "Entregado" && r.budget_status !== "Entregado" && (r.budget_total || 0) > 0) || []
  const pendingAmount = pendingRepairs.reduce((acc: number, r: any) => acc + (r.budget_total || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Módulo de Cobranzas</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Supervisión de pagos, cuentas por cobrar y facturación de servicios mecánicos.</p>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Aviso del sistema</p>
            <p className="text-amber-700">{fetchError}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Facturado / Cotizado</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(totalAmount)}</h3>
                <p className="text-xs text-zinc-400 mt-1">{repairs.length} órdenes registradas</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Cobrado (Entregados)</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(collectedAmount)}</h3>
                <p className="text-xs text-emerald-600/80 mt-1">{collectedRepairs.length} órdenes liquidadas</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Por Cobrar / En Taller</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(pendingAmount)}</h3>
                <p className="text-xs text-amber-600/80 mt-1">{pendingRepairs.length} cuentas pendientes</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Tasa de Liquidación</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">
                  {totalAmount > 0 ? `${Math.round((collectedAmount / totalAmount) * 100)}%` : "0%"}
                </h3>
                <p className="text-xs text-blue-600/80 mt-1">Efectividad de cobros</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="border-zinc-200 shadow-sm">
        <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Estado de Cobros por Orden de Trabajo</h2>
            <p className="text-xs text-zinc-500">Monitoreo de pagos vinculados a vehículos y clientes.</p>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput placeholder="Buscar por cliente o motivo..." />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-zinc-100 p-4 space-y-3">
          {repairs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No se encontraron registros de cobros o reparaciones.
            </div>
          ) : (
            repairs.map((repair: any) => {
              const client = repair.vehicle?.client
              const vehicle = repair.vehicle
              const isPaid = repair.status === "Entregado" || repair.budget_status === "Entregado"
              const hasBudget = (repair.budget_total || 0) > 0

              return (
                <div key={repair.id} className="pt-3 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-zinc-900 text-sm block">
                        👤 {client?.name || "Sin cliente"}
                      </span>
                      {vehicle && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          🚗 {vehicle.brand} {vehicle.model} ({vehicle.plate})
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total</p>
                      <p className="text-sm font-bold text-zinc-900 font-mono">
                        {formatCurrency(repair.budget_total || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs font-normal">
                        {repair.status}
                      </Badge>
                      {isPaid ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Cobrado
                        </Badge>
                      ) : hasBudget ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-400">
                          Sin cotizar
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {repair.entry_date || "S/F"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100 flex-wrap">
                    {client?.phone && hasBudget && (
                      <a
                        href={generateWhatsAppLink(
                          client.phone,
                          `Hola ${client.name}, le saludamos de Taller San Luis sobre su vehículo ${vehicle?.brand} ${vehicle?.model}. El estado actual es: "${repair.status}". Total: ${formatCurrency(repair.budget_total || 0)}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md active:bg-emerald-100"
                      >
                        <Phone className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/reparaciones/${repair.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver
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
                <TableHead className="w-[120px]">Fecha Ingreso</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Estado Trabajo</TableHead>
                <TableHead>Estado Cobro</TableHead>
                <TableHead className="text-right">Monto Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                    No se encontraron registros de cobros o reparaciones.
                  </TableCell>
                </TableRow>
              ) : (
                repairs.map((repair: any) => {
                  const client = repair.vehicle?.client
                  const vehicle = repair.vehicle
                  const isPaid = repair.status === "Entregado" || repair.budget_status === "Entregado"
                  const hasBudget = (repair.budget_total || 0) > 0

                  return (
                    <TableRow key={repair.id} className="hover:bg-zinc-50/60 transition-colors">
                      <TableCell className="text-xs text-zinc-500 font-medium">
                        {repair.entry_date || "S/F"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5 text-zinc-400" />
                            {client?.name || "Sin cliente"}
                          </span>
                          {client?.phone && (
                            <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-zinc-400" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-zinc-700">
                          <Car className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {vehicle?.brand} {vehicle?.model}
                            {vehicle?.plate ? ` (${vehicle.plate})` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {repair.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Cobrado
                          </Badge>
                        ) : hasBudget ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-zinc-400">
                            Sin cotizar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900 text-sm">
                        {formatCurrency(repair.budget_total || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {client?.phone && hasBudget && (
                            <a
                              href={generateWhatsAppLink(
                                client.phone,
                                `Hola ${client.name}, le saludamos desde Taller Mecánico San Luis respecto a su vehículo ${vehicle?.brand} ${vehicle?.model}. El estado actual del servicio es: "${repair.status}". Total: ${formatCurrency(repair.budget_total || 0)}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                              title="Enviar estado por WhatsApp"
                            >
                              <Phone className="h-3 w-3" />
                              WhatsApp
                            </a>
                          )}
                          <Link
                            href={`/reparaciones/${repair.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
