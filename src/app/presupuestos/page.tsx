import { getBudgets } from "@/actions/budgets"
import { BudgetStatusToggle } from "@/components/budgets/BudgetStatusToggle"
import { DigitalBudgetModal } from "@/components/repairs/DigitalBudgetModal"
import { EditRepairModal, DeleteRepairButton } from "@/components/repairs/RepairActions"
import { RepairForm } from "@/components/forms/RepairForm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import Link from "next/link"
import { FileText, Plus, Calendar, AlertTriangle, DollarSign, Clock, CheckCircle2, PackageCheck, Eye, Car } from "lucide-react"

export default async function PresupuestosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const { budgets, error: fetchError } = await getBudgets(q)

  const totalBudgetsCount = budgets?.length || 0
  const pendingCount = budgets?.filter((b: any) => !b.budget_status || b.budget_status === "Pendiente" || b.budget_status === "Borrador" || b.budget_status === "Enviado").length || 0
  const acceptedCount = budgets?.filter((b: any) => b.budget_status === "Aceptado" || b.budget_status === "Aprobado").length || 0
  const deliveredCount = budgets?.filter((b: any) => b.budget_status === "Entregado").length || 0

  const totalAmountSum = budgets?.reduce((sum: number, b: any) => sum + (b.budget_total || 0), 0) || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestión de Presupuestos</h1>
          <p className="text-sm text-zinc-500">Listado de cotizaciones con control rápido de estado (Pendiente, Aceptado, Entregado).</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Monto Presupuestado</p>
              <p className="text-xl font-bold text-zinc-900">{formatCurrency(totalAmountSum)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pendientes</p>
              <p className="text-2xl font-bold text-zinc-900">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Aceptados</p>
              <p className="text-2xl font-bold text-zinc-900">{acceptedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-900">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Entregados</p>
              <p className="text-2xl font-bold text-zinc-900">{deliveredCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchInput placeholder="Buscar por cliente, chapa o motivo..." />
      </div>

      {/* Budgets Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
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
            {(!budgets || budgets.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-zinc-300" />
                    <p className="font-medium text-zinc-700">No hay presupuestos registrados</p>
                    <p className="text-xs text-zinc-500">Haz clic en "Crear Presupuesto" para registrar la primera cotización.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((b: any) => {
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
    </div>
  )
}
