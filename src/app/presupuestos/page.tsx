import { getBudgets } from "@/actions/budgets"
import { getClients } from "@/actions/clients"
import { BudgetStatusToggle } from "@/components/budgets/BudgetStatusToggle"
import { DigitalBudgetModal } from "@/components/repairs/DigitalBudgetModal"
import { EditRepairModal, DeleteRepairButton } from "@/components/repairs/RepairActions"
import { RepairForm } from "@/components/forms/RepairForm"
import { BudgetFiltersBar } from "@/components/budgets/BudgetFiltersBar"
import { BudgetPagination } from "@/components/budgets/BudgetPagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { FileText, Plus, Calendar, AlertTriangle, DollarSign, Clock, CheckCircle2, PackageCheck, Eye, Car, Receipt } from "lucide-react"

export default async function PresupuestosPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    q?: string
    client?: string
    from?: string
    to?: string
    status?: string
    page?: string
  }> 
}) {
  const params = await searchParams
  const q = params.q || ""
  const clientId = params.client || ""
  const startDate = params.from || ""
  const endDate = params.to || ""
  const status = params.status || ""
  const page = parseInt(params.page || "1", 10) || 1

  // Cargar clientes para el selector de filtro
  const { clients } = await getClients()

  // Cargar métricas globales de la vista
  const { budgets: allBudgets } = await getBudgets()

  // Cargar presupuestos con filtros aplicados (búsqueda, cliente, fecha desde-hasta)
  const { budgets: filteredBudgets, error: fetchError } = await getBudgets({
    q,
    clientId,
    startDate,
    endDate,
    status
  })

  const budgets = filteredBudgets || []

  // Métricas globales
  const totalAmountSum = allBudgets?.reduce((sum: number, b: any) => sum + (b.budget_total || 0), 0) || 0
  const pendingCount = allBudgets?.filter((b: any) => !b.budget_status || b.budget_status === "Pendiente" || b.budget_status === "Borrador" || b.budget_status === "Enviado").length || 0
  const acceptedCount = allBudgets?.filter((b: any) => b.budget_status === "Aceptado" || b.budget_status === "Aprobado").length || 0
  const deliveredCount = allBudgets?.filter((b: any) => b.budget_status === "Entregado").length || 0
  const invoicedCount = allBudgets?.filter((b: any) => b.budget_status === "Facturado").length || 0

  // Configuración de Paginación
  const PAGE_SIZE = 10
  const totalItems = budgets.length
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const paginatedBudgets = budgets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Gestión de Presupuestos</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Listado de cotizaciones con control rápido de estado (Pendiente, Aceptado, Entregado, Facturado).</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" /> Crear Presupuesto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Orden & Presupuesto Digital</DialogTitle>
            </DialogHeader>
            <RepairForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Connection error banner */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Error de conexión a la base de datos</p>
            <p className="text-amber-700">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: Monto Total */}
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Monto Total
              </span>
              <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm xs:text-base sm:text-xl font-bold font-mono text-zinc-900 leading-tight">
                {formatCurrency(totalAmountSum)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pendientes */}
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Pendientes
              </span>
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Aceptados */}
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Aceptados
              </span>
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{acceptedCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Entregados */}
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Entregados
              </span>
              <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-800 shrink-0">
                <PackageCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{deliveredCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Facturados */}
        <Link href="/facturacion" className="group">
          <Card className="bg-white border-zinc-200 shadow-xs hover:border-purple-300 transition-colors h-full">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-purple-700 uppercase tracking-wider line-clamp-1">
                  Facturados
                </span>
                <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:scale-105 transition-transform shrink-0">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{invoicedCount}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Filtros Avanzados: Búsqueda, Cliente, Fecha Desde-Hasta */}
      <BudgetFiltersBar clients={clients || []} />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {(!paginatedBudgets || paginatedBudgets.length === 0) ? (
          <div className="text-center py-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-500 text-sm space-y-2">
            <p className="font-semibold text-zinc-700">No se encontraron presupuestos.</p>
            <p className="text-xs text-zinc-400">Prueba ajustando los filtros de búsqueda, cliente o fechas.</p>
          </div>
        ) : (
          paginatedBudgets.map((b: any) => {
            const vehicle = b.vehicle
            const client = vehicle?.client

            return (
              <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                      #PRES-{b.id.slice(0, 8)}
                    </Badge>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {new Date(b.entry_date).toLocaleDateString("es-PY")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Monto Total</p>
                    <p className="text-sm sm:text-base font-bold text-emerald-700 font-mono whitespace-nowrap">
                      {formatCurrency(b.budget_total || 0)}
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1.5 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-zinc-900">👤 {client?.name || "Sin cliente"}</span>
                    {vehicle && (
                      <span className="text-zinc-500">
                        · {vehicle.brand} {vehicle.model} ({vehicle.plate})
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-700 break-words leading-relaxed">{b.reason}</p>
                </div>

                {/* Status Toggle Rápido */}
                <div className="pt-2 border-t border-zinc-100">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Estado:</p>
                  <BudgetStatusToggle repairId={b.id} currentStatus={b.budget_status || "Pendiente"} />
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                  <div className="w-full sm:w-auto">
                    <DigitalBudgetModal repair={b} />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <Link
                      href={`/reparaciones/${b.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="h-3.5 w-3.5" /> Detalle
                    </Link>
                    <EditRepairModal repair={b} />
                    <DeleteRepairButton repairId={b.id} reason={b.reason} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Budgets Table */}
      <div className="hidden md:block rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">N° Presupuesto</TableHead>
              <TableHead className="font-semibold text-zinc-700">Cliente / Vehículo</TableHead>
              <TableHead className="font-semibold text-zinc-700">Detalle / Motivo</TableHead>
              <TableHead className="font-semibold text-zinc-700">Monto Total</TableHead>
              <TableHead className="font-semibold text-zinc-700">Estado (Cambio Rápido)</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!paginatedBudgets || paginatedBudgets.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-zinc-300" />
                    <p className="font-semibold text-zinc-700">No se encontraron presupuestos</p>
                    <p className="text-xs text-zinc-400">Prueba cambiando el texto de búsqueda, seleccionando otro cliente o ajustando el rango de fechas.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedBudgets.map((b: any) => {
                const vehicle = b.vehicle
                const client = vehicle?.client
                const itemsCount = b.budget_items?.length || 0

                return (
                  <TableRow key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                          #PRES-{b.id.slice(0, 8)}
                        </Badge>
                        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(b.entry_date).toLocaleDateString("es-PY")}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        {client ? (
                          <span className="font-semibold text-zinc-900 text-xs block">👤 {client.name}</span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Cliente General</span>
                        )}
                        {vehicle && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase bg-zinc-50">
                              {vehicle.plate}
                            </Badge>
                            <span className="text-xs text-zinc-500 font-medium">{vehicle.brand} {vehicle.model}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium text-zinc-900 text-xs line-clamp-1">{b.reason}</p>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          📋 {itemsCount} {itemsCount === 1 ? "ítem cargado" : "ítems cargados"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm font-bold text-zinc-900">
                        {formatCurrency(b.budget_total || 0)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <BudgetStatusToggle repairId={b.id} currentStatus={b.budget_status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <DigitalBudgetModal repair={b} />
                        <EditRepairModal repair={b} />
                        <DeleteRepairButton repairId={b.id} reason={b.reason} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <BudgetPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
