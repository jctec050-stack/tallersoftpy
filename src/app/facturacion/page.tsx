import { getRepairs } from "@/actions/repairs"
import { getClients } from "@/actions/clients"
import { InvoicingManager, type RepairInvoiceItem, type ClientInfo } from "@/components/invoicing/InvoicingManager"
import { Card, CardContent } from "@/components/ui/card"
import { Receipt, Clock, CheckCircle2, Building2, AlertTriangle } from "lucide-react"

export default async function FacturacionPage() {
  const [repairsRes, clientsRes] = await Promise.all([
    getRepairs(),
    getClients(),
  ])

  const repairs: RepairInvoiceItem[] = (repairsRes.repairs as unknown as RepairInvoiceItem[]) || []
  const clients: ClientInfo[] = (clientsRes.clients as unknown as ClientInfo[]) || []
  const fetchError = repairsRes.error || clientsRes.error

  // Cálculos de KPIs
  const deliveredRepairs = repairs.filter(
    (r) => r.budget_status === "Entregado" || (r.status === "Entregado" && r.budget_status !== "Facturado")
  )
  const deliveredAmount = deliveredRepairs.reduce((sum, r) => sum + (r.budget_total || 0), 0)

  const invoicedRepairs = repairs.filter((r) => r.budget_status === "Facturado")
  const invoicedAmount = invoicedRepairs.reduce((sum, r) => sum + (r.budget_total || 0), 0)

  const clientsWithPending = clients.filter((c) =>
    deliveredRepairs.some((r) => r.vehicle?.client?.id === c.id || r.vehicle?.client_id === c.id)
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Módulo de Facturación
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Control Fiscal
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Factura presupuestos de trabajos finalizados (estado Entregado), agrupa múltiples servicios por cliente y mantén un control exacto.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Aviso de conexión</p>
            <p className="text-amber-700">{fetchError}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Por Facturar (Entregados) */}
        <Card className="border-zinc-200 shadow-xs bg-white">
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider line-clamp-1">
                Por Facturar
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="text-sm xs:text-base sm:text-2xl font-bold font-mono text-zinc-900 leading-tight">
                {formatCurrency(deliveredAmount)}
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-700 font-medium mt-1 leading-snug">
                {deliveredRepairs.length} {deliveredRepairs.length === 1 ? "trabajo entregado" : "trabajos entregados"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Facturado */}
        <Card className="border-zinc-200 shadow-xs bg-white">
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-purple-700 uppercase tracking-wider line-clamp-1">
                Total Facturado
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="text-sm xs:text-base sm:text-2xl font-bold font-mono text-purple-900 leading-tight">
                {formatCurrency(invoicedAmount)}
              </h3>
              <p className="text-[11px] sm:text-xs text-purple-600 font-medium mt-1 leading-snug">
                {invoicedRepairs.length} {invoicedRepairs.length === 1 ? "orden facturada" : "órdenes facturadas"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Clientes esperando factura */}
        <Card className="border-zinc-200 shadow-xs bg-white">
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider line-clamp-1">
                Clientes
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="text-sm xs:text-base sm:text-2xl font-bold font-mono text-zinc-900 leading-tight">
                {clientsWithPending.length}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-snug">
                Con trabajos a liquidar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Efectividad de Facturación */}
        <Card className="border-zinc-200 shadow-xs bg-white">
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider line-clamp-1">
                Tasa Facturación
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <h3 className="text-sm xs:text-base sm:text-2xl font-bold font-mono text-emerald-700 leading-tight">
                {deliveredAmount + invoicedAmount > 0
                  ? `${Math.round((invoicedAmount / (deliveredAmount + invoicedAmount)) * 100)}%`
                  : "100%"}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-600 font-medium mt-1 leading-snug">
                Entregados vs Facturados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoicing Manager Principal */}
      <InvoicingManager repairs={repairs} clients={clients} />
    </div>
  )
}
