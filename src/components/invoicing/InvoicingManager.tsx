"use client"

import { useState, useEffect } from "react"
import { updateBudgetStatus } from "@/actions/budgets"
import {
  InvoiceData,
  InvoiceRepairSummary,
  createInvoiceRecord,
  cancelInvoice,
} from "@/actions/invoices"
import {
  getLocalStoredInvoices,
  saveLocalStoredInvoice,
  markLocalInvoiceAsAnulada,
  mergeInvoices,
} from "@/lib/invoices-store"
import { formatInvoiceNumber } from "@/lib/invoice-utils"
import { WORKSHOP_CONFIG } from "@/lib/company-config"
import { DigitalInvoiceModal } from "@/components/invoicing/DigitalInvoiceModal"
import { DigitalBudgetModal } from "@/components/repairs/DigitalBudgetModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  User,
  Car,
  Loader2,
  CheckSquare,
  Square,
  Undo2,
  Search,
  ShieldCheck,
  Building2,
  FileDown,
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

export interface VehicleInfo {
  id?: string
  brand: string
  model: string
  plate: string
  year?: number
  mileage?: number
  client_id?: string
  client?: ClientInfo
}

export interface ClientInfo {
  id: string
  name: string
  document?: string
  phone?: string
  email?: string
  address?: string
}

export interface RepairInvoiceItem {
  id: string
  entry_date?: string
  reason: string
  diagnosis?: string
  priority?: string
  status: string
  budget_status?: string
  budget_total?: number
  budget_items?: Array<{
    id?: string
    description: string
    quantity: number
    price: number
    total: number
  }>
  vehicle?: VehicleInfo
}

interface InvoicingManagerProps {
  repairs: RepairInvoiceItem[]
  clients: ClientInfo[]
  initialInvoices?: InvoiceData[]
}

export function InvoicingManager({ repairs, clients, initialInvoices = [] }: InvoicingManagerProps) {
  // 1. Filtrar presupuestos entregados (listos para facturar) y facturados (historial individual)
  const deliveredRepairs = repairs.filter(
    (r) => r.budget_status === "Entregado" || (r.status === "Entregado" && r.budget_status !== "Facturado")
  )
  const invoicedRepairs = repairs.filter((r) => r.budget_status === "Facturado")

  // Clientes que tienen al menos un presupuesto entregado pendiente de facturación
  const clientsWithPending = clients.filter((c) =>
    deliveredRepairs.some((r) => r.vehicle?.client?.id === c.id || r.vehicle?.client_id === c.id)
  )

  // Estados del componente
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clientsWithPending.length > 0 ? clientsWithPending[0].id : clients[0]?.id || ""
  )
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [invoiceType, setInvoiceType] = useState<string>("Contado")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"facturar" | "historial">("facturar")
  const [searchHistorial, setSearchHistorial] = useState<string>("")
  const [historySubTab, setHistorySubTab] = useState<"facturas" | "ordenes">("facturas")
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)

  // Facturas emitidas (merge entre Supabase y localStorage)
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    return mergeInvoices(initialInvoices, getLocalStoredInvoices())
  })
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<InvoiceData | null>(null)

  useEffect(() => {
    const merged = mergeInvoices(initialInvoices, getLocalStoredInvoices())
    setInvoices(merged)
  }, [initialInvoices])

  // Cliente actualmente seleccionado
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  // Presupuestos entregados del cliente seleccionado
  const clientDeliveredRepairs = deliveredRepairs.filter(
    (r) => r.vehicle?.client?.id === selectedClientId || r.vehicle?.client_id === selectedClientId
  )

  // Sugerencia automática del próximo número de factura
  useEffect(() => {
    if (!invoiceNumber) {
      const nextSeq = invoices.length + 1
      setInvoiceNumber(formatInvoiceNumber("", nextSeq))
    }
  }, [invoices.length])

  // Cambiar cliente y preseleccionar todos sus presupuestos entregados
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId)
    const clientRepairs = deliveredRepairs.filter(
      (r) => r.vehicle?.client?.id === clientId || r.vehicle?.client_id === clientId
    )
    setSelectedRepairIds(clientRepairs.map((r) => r.id))
    setSuccessMessage(null)
    setErrorMessage(null)
    setLastCreatedInvoice(null)
  }

  // Toggle de selección individual
  const toggleSelectRepair = (id: string) => {
    if (selectedRepairIds.includes(id)) {
      setSelectedRepairIds(selectedRepairIds.filter((item) => item !== id))
    } else {
      setSelectedRepairIds([...selectedRepairIds, id])
    }
  }

  // Seleccionar o deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedRepairIds.length === clientDeliveredRepairs.length) {
      setSelectedRepairIds([])
    } else {
      setSelectedRepairIds(clientDeliveredRepairs.map((r) => r.id))
    }
  }

  // Calcular la suma total de los presupuestos seleccionados
  const totalAmountToInvoice = clientDeliveredRepairs
    .filter((r) => selectedRepairIds.includes(r.id))
    .reduce((sum, r) => sum + (r.budget_total || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // EJECUTAR FACTURACIÓN Y EMISIÓN DE FACTURA FÍSICA / PDF
  const handleInvoice = async () => {
    if (selectedRepairIds.length === 0) {
      setErrorMessage("Por favor selecciona al menos un presupuesto para facturar.")
      return
    }

    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    setLastCreatedInvoice(null)

    try {
      const selectedRepairsList = clientDeliveredRepairs.filter((r) =>
        selectedRepairIds.includes(r.id)
      )

      // Número de factura formateado
      const nextSeq = invoices.length + 1
      const finalInvoiceNumber = formatInvoiceNumber(invoiceNumber, nextSeq)

      // Resumen completo de cada presupuesto incluido
      const repairsSummary: InvoiceRepairSummary[] = selectedRepairsList.map((r) => ({
        repair_id: r.id,
        reason: r.reason,
        vehicle: r.vehicle
          ? {
              brand: r.vehicle.brand,
              model: r.vehicle.model,
              plate: r.vehicle.plate,
              year: r.vehicle.year,
              mileage: r.vehicle.mileage,
            }
          : undefined,
        budget_total: r.budget_total || 0,
        items: (r.budget_items || []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
      }))

      const subtotal = totalAmountToInvoice
      const tax10 = Math.round(subtotal / 11)

      const newInvoice: InvoiceData = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`,
        created_at: new Date().toISOString(),
        invoice_number: finalInvoiceNumber,
        date: new Date().toISOString().split("T")[0],
        condition: invoiceType,
        status: "Emitida",
        client_id: selectedClientId,
        client: {
          id: selectedClient?.id,
          name: selectedClient?.name || "Sin nombre",
          document: selectedClient?.document,
          phone: selectedClient?.phone,
          email: selectedClient?.email,
          address: selectedClient?.address,
        },
        repair_ids: selectedRepairIds,
        repairs_summary: repairsSummary,
        subtotal,
        tax_5: 0,
        tax_10: tax10,
        tax_total: tax10,
        total: subtotal,
        timbrado: WORKSHOP_CONFIG.timbrado,
        valid_until: WORKSHOP_CONFIG.validUntil,
      }

      // Guardar en servidor
      await createInvoiceRecord(newInvoice)

      // Guardar en almacenamiento local
      saveLocalStoredInvoice(newInvoice)
      setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)])
      setLastCreatedInvoice(newInvoice)

      const count = selectedRepairIds.length
      setSuccessMessage(
        `¡Factura ${newInvoice.invoice_number} emitida con éxito! Se incluyeron ${count} ${
          count === 1 ? "presupuesto" : "presupuestos"
        }.`
      )

      setSelectedRepairIds([])
      setInvoiceNumber(formatInvoiceNumber("", nextSeq + 1))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la facturación."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ANULAR FACTURA Y DEVOLVER PRESUPUESTOS AL ESTADO ENTREGADO
  const handleCancelInvoice = async (inv: InvoiceData) => {
    if (
      !confirm(
        `¿Estás seguro de anular la Factura ${inv.invoice_number}? Todos los presupuestos asociados volverán al estado 'Entregado' para poder ser facturados nuevamente.`
      )
    ) {
      return
    }

    setIsSubmitting(true)
    try {
      await cancelInvoice(inv.id, inv.repair_ids)
      markLocalInvoiceAsAnulada(inv.id)
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: "Anulada" } : i))
      )
      setSuccessMessage(
        `Factura ${inv.invoice_number} anulada correctamente. Los presupuestos volvieron a estar listos para facturar.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al anular la factura."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Revertir presupuesto individual facturado a entregado
  const handleRevertIndividualRepair = async (repairId: string) => {
    if (!confirm("¿Deseas revertir este presupuesto al estado 'Entregado'?")) return
    setIsSubmitting(true)
    try {
      await updateBudgetStatus(repairId, "Entregado")
      setSuccessMessage("Presupuesto revertido al estado 'Entregado'.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al revertir estado."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrado de Facturas en Historial
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchHistorial) return true
    const q = searchHistorial.toLowerCase()
    const num = (inv.invoice_number || "").toLowerCase()
    const clientName = (inv.client?.name || "").toLowerCase()
    const clientDoc = (inv.client?.document || "").toLowerCase()
    const hasPlate = inv.repairs_summary?.some((r) =>
      r.vehicle?.plate?.toLowerCase().includes(q)
    )
    const hasReason = inv.repairs_summary?.some((r) =>
      r.reason?.toLowerCase().includes(q)
    )
    return num.includes(q) || clientName.includes(q) || clientDoc.includes(q) || hasPlate || hasReason
  })

  // Filtrado de reparaciones individuales en Historial
  const filteredInvoicedRepairs = invoicedRepairs.filter((r) => {
    if (!searchHistorial) return true
    const q = searchHistorial.toLowerCase()
    const clientName = r.vehicle?.client?.name?.toLowerCase() || ""
    const plate = r.vehicle?.plate?.toLowerCase() || ""
    const reason = r.reason?.toLowerCase() || ""
    return clientName.includes(q) || plate.includes(q) || reason.includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas Principales */}
      <div className="flex border-b border-zinc-200 gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("facturar")
            setSuccessMessage(null)
          }}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "facturar"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Receipt className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="sm:inline hidden">Facturar Trabajos Entregados</span>
          <span className="sm:hidden inline">Facturar Entregados</span>
          {deliveredRepairs.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] sm:text-[11px] px-1.5 py-0">
              {deliveredRepairs.length}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("historial")
            setSuccessMessage(null)
          }}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "historial"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-purple-600" />
          <span className="sm:inline hidden">Historial de Facturas Emitidas</span>
          <span className="sm:hidden inline">Historial Facturas</span>
          {invoices.length > 0 && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] sm:text-[11px] px-1.5 py-0 font-bold">
              {invoices.length} {invoices.length === 1 ? "factura" : "facturas"}
            </Badge>
          )}
        </button>
      </div>

      {/* Alerta de Éxito con Acceso Directo a la Factura Recién Creada */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          {lastCreatedInvoice && (
            <div className="flex items-center gap-2">
              <DigitalInvoiceModal
                invoice={lastCreatedInvoice}
                trigger={
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8">
                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> Ver Factura #{lastCreatedInvoice.invoice_number}
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* PESTAÑA 1: FACTURAR TRABAJOS ENTREGADOS */}
      {activeTab === "facturar" && (
        <div className="space-y-6">
          {/* 1. Atajos rápidos de clientes con presupuestos listos */}
          {clientsWithPending.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                Clientes con órdenes finalizadas listas para facturar:
              </span>
              <div className="flex flex-wrap gap-2">
                {clientsWithPending.map((c) => {
                  const pendingCount = deliveredRepairs.filter(
                    (r) => r.vehicle?.client?.id === c.id || r.vehicle?.client_id === c.id
                  ).length
                  const isCurrent = c.id === selectedClientId

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border max-w-full ${
                        isCurrent
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                          isCurrent ? "bg-zinc-800 text-amber-300" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {pendingCount} {pendingCount === 1 ? "orden" : "órdenes"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 2. Grid de Trabajo: Selección de Cliente y Presupuestos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda / Central: Selección y Lista de Presupuestos (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Selector de Cliente */}
              <Card className="border-zinc-200 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-500" /> Seleccionar Cliente
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Elige el cliente para consultar sus presupuestos finalizados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {clients.map((c) => {
                      const count = deliveredRepairs.filter(
                        (r) => r.vehicle?.client?.id === c.id || r.vehicle?.client_id === c.id
                      ).length
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} {count > 0 ? `(${count} trabajos entregados)` : "(0 entregados)"}
                        </option>
                      )
                    })}
                  </select>
                </CardContent>
              </Card>

              {/* Lista de Presupuestos Entregados para el cliente seleccionado */}
              {selectedClient ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        Presupuestos Entregados ({clientDeliveredRepairs.length})
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Marca los trabajos que se incluirán en la factura física / PDF.
                      </p>
                    </div>

                    {clientDeliveredRepairs.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="text-xs h-8 shrink-0 self-start sm:self-auto"
                      >
                        {selectedRepairIds.length === clientDeliveredRepairs.length ? (
                          <>
                            <Square className="h-3.5 w-3.5 mr-1" /> Deseleccionar todos
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-3.5 w-3.5 mr-1" /> Seleccionar todos
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {clientDeliveredRepairs.length === 0 ? (
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-8 text-center text-xs text-zinc-500 space-y-2">
                      <p className="text-sm font-semibold text-zinc-700">
                        No hay presupuestos entregados para este cliente
                      </p>
                      <p className="max-w-md mx-auto">
                        Los presupuestos deben estar en estado <strong>&quot;Entregado&quot;</strong> (trabajo finalizado) para poder ser facturados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientDeliveredRepairs.map((repair: RepairInvoiceItem) => {
                        const isChecked = selectedRepairIds.includes(repair.id)
                        const vehicle = repair.vehicle

                        return (
                          <div
                            key={repair.id}
                            onClick={() => toggleSelectRepair(repair.id)}
                            className={`rounded-xl border p-4 transition-all cursor-pointer select-none space-y-2.5 ${
                              isChecked
                                ? "bg-zinc-50/90 border-zinc-900 ring-1 ring-zinc-900 shadow-xs"
                                : "bg-white border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked
                                      ? "bg-zinc-900 border-zinc-900 text-white"
                                      : "border-zinc-300 bg-white"
                                  }`}
                                >
                                  {isChecked && <CheckSquare className="h-3.5 w-3.5" />}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs uppercase bg-white font-bold"
                                  >
                                    #PRES-{repair.id.slice(0, 8)}
                                  </Badge>
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                    🚗 Entregado
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 pl-7 sm:pl-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                                <span className="text-[11px] text-zinc-500 sm:hidden">Monto presupuesto:</span>
                                <span className="font-mono text-sm sm:text-base font-bold text-zinc-900 whitespace-nowrap">
                                  {formatCurrency(repair.budget_total || 0)}
                                </span>
                              </div>
                            </div>

                            {/* Info de Vehículo y Motivo */}
                            <div className="text-xs text-zinc-600 pl-7 space-y-1">
                              {vehicle && (
                                <p className="font-medium text-zinc-800 flex items-center gap-1.5 flex-wrap">
                                  <Car className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                  <span>
                                    {vehicle.brand} {vehicle.model}
                                  </span>
                                  <span className="font-mono bg-zinc-200/60 px-1.5 py-0.2 rounded text-[11px] text-zinc-700">
                                    {vehicle.plate}
                                  </span>
                                  {vehicle.mileage && (
                                    <span suppressHydrationWarning className="text-zinc-400 font-mono text-[10px]">
                                      ({vehicle.mileage.toLocaleString("es-PY")} km)
                                    </span>
                                  )}
                                </p>
                              )}
                              <p className="text-zinc-700 break-words leading-relaxed">
                                <strong className="text-zinc-900">Trabajo:</strong> {repair.reason}
                              </p>
                            </div>

                            {/* Detalle de Ítems */}
                            {repair.budget_items && repair.budget_items.length > 0 && (
                              <div className="pl-7 text-[11px] text-zinc-500 flex flex-wrap gap-1.5">
                                {repair.budget_items.slice(0, 3).map((item, idx) => (
                                  <span key={idx} className="bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5">
                                    {item.description} ({item.quantity}x)
                                  </span>
                                ))}
                                {repair.budget_items.length > 3 && (
                                  <span className="text-zinc-400 italic">
                                    +{repair.budget_items.length - 3} ítems más
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Modal de Detalle y Fecha */}
                            <div
                              className="pt-2.5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-0 sm:pl-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between sm:justify-start gap-2 pl-7 sm:pl-0">
                                <span className="text-[11px] text-zinc-500 font-medium">
                                  {repair.entry_date
                                    ? `Ingreso: ${new Date(repair.entry_date).toLocaleDateString("es-PY")}`
                                    : ""}
                                </span>
                              </div>
                              <div className="w-full sm:w-auto">
                                <DigitalBudgetModal repair={repair} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-zinc-400">
                  Selecciona un cliente para comenzar.
                </div>
              )}
            </div>

            {/* Columna Derecha: Panel de Liquidación y Facturación (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              {/* Datos Fiscales del Cliente */}
              {selectedClient && (
                <Card className="border-zinc-200 bg-zinc-50/50 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-zinc-600" /> Datos del Cliente / Razón Social
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5">
                    <p className="font-bold text-sm text-zinc-900">{selectedClient.name}</p>
                    <p className="text-zinc-600">
                      <strong>RUC / C.I.:</strong> {selectedClient.document || "Sin documento"}
                    </p>
                    <p className="text-zinc-600">
                      <strong>Teléfono:</strong> {selectedClient.phone || "Sin teléfono"}
                    </p>
                    {selectedClient.address && (
                      <p className="text-zinc-600">
                        <strong>Dirección:</strong> {selectedClient.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Formulario y Confirmación de Factura */}
              <Card className="border-zinc-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-zinc-100">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" /> Resumen de Facturación
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configuración del comprobante fiscal a emitir
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_num" className="text-xs font-semibold flex justify-between">
                      <span>Número de Factura Fiscal</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Talonario / Auto</span>
                    </Label>
                    <Input
                      id="invoice_num"
                      placeholder="Ej: 001-001-0000001"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="font-mono text-xs h-9 font-bold text-zinc-900"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Formato paraguayo oficial: <strong>001-001-XXXXXXX</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_type" className="text-xs font-semibold">
                      Condición de Venta
                    </Label>
                    <select
                      id="invoice_type"
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                    >
                      <option value="Contado">Contado</option>
                      <option value="Crédito 30 días">Crédito 30 días</option>
                      <option value="Crédito 15 días">Crédito 15 días</option>
                      <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    </select>
                  </div>

                  {/* Resumen de totales y Liquidación IVA */}
                  <div className="rounded-xl bg-zinc-900 text-white p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                      <span>Presupuestos agrupados:</span>
                      <strong className="text-zinc-200 font-mono text-xs sm:text-sm">
                        {selectedRepairIds.length} {selectedRepairIds.length === 1 ? "orden" : "órdenes"}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                      <span>Liquidación IVA 10% (incl.):</span>
                      <strong className="text-zinc-300 font-mono text-xs">
                        {formatCurrency(Math.round(totalAmountToInvoice / 11))}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1">
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300">
                        Total Factura:
                      </span>
                      <span className="font-mono text-base sm:text-xl font-bold text-emerald-400 whitespace-nowrap">
                        {formatCurrency(totalAmountToInvoice)}
                      </span>
                    </div>
                  </div>

                  {/* Botón Facturar */}
                  <Button
                    type="button"
                    onClick={handleInvoice}
                    disabled={isSubmitting || selectedRepairIds.length === 0}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emitiendo Factura y PDF...
                      </>
                    ) : (
                      <>
                        <Receipt className="mr-2 h-4 w-4" /> Emitir Factura ({selectedRepairIds.length})
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                    Al emitir, se guardará el comprobante físico en el <strong>Historial de Facturas</strong> y podrás descargarlo en PDF o imprimirlo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Barra Flotante Móvil para Facturar cuando hay presupuestos seleccionados */}
          {selectedRepairIds.length > 0 && (
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-zinc-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-zinc-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">
                  {selectedRepairIds.length} {selectedRepairIds.length === 1 ? "orden seleccionada" : "órdenes seleccionadas"}
                </p>
                <p className="font-mono text-sm sm:text-base font-bold text-emerald-400 truncate">
                  {formatCurrency(totalAmountToInvoice)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("invoice_num")
                  el?.scrollIntoView({ behavior: "smooth", block: "center" })
                  el?.focus()
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 shrink-0 font-semibold shadow-sm"
              >
                <Receipt className="h-3.5 w-3.5 mr-1" /> Ir a Facturar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL DE FACTURAS EMITIDAS */}
      {activeTab === "historial" && (
        <div className="space-y-4">
          {/* Cabecera y Selector de Sub-Pestaña */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" /> Historial de Facturas Emitidas
              </h3>
              <p className="text-xs text-zinc-500">
                Consulta tus facturas fiscales agrupadas, descarga el PDF oficial o anula comprobantes.
              </p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar N° factura, cliente, RUC..."
                value={searchHistorial}
                onChange={(e) => setSearchHistorial(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
          </div>

          {/* Sub-tabs: Facturas Grupales vs Órdenes Individuales */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setHistorySubTab("facturas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                historySubTab === "facturas"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Facturas Emitidas ({filteredInvoices.length})
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab("ordenes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                historySubTab === "ordenes"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Órdenes Individuales Facturadas ({filteredInvoicedRepairs.length})
            </button>
          </div>

          {/* SUB-PESTAÑA A: FACTURAS EMITIDAS (AGRUPADAS) */}
          {historySubTab === "facturas" && (
            <div>
              {filteredInvoices.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400 text-xs space-y-2">
                  <Receipt className="h-10 w-10 mx-auto text-zinc-300" />
                  <p className="font-semibold text-zinc-700 text-sm">No hay facturas emitidas aún</p>
                  <p>
                    Selecciona presupuestos entregados en la pestaña <strong>&quot;Facturar Trabajos Entregados&quot;</strong> para generar tu primera factura física con PDF.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((inv) => {
                    const isExpanded = expandedInvoiceId === inv.id
                    const isAnulada = inv.status === "Anulada"
                    const repairsCount = inv.repairs_summary?.length || inv.repair_ids?.length || 0

                    return (
                      <div
                        key={inv.id}
                        className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                          isAnulada ? "border-zinc-200 opacity-60 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {/* Cabecera de la Factura */}
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm sm:text-base font-bold text-zinc-900">
                                🧾 Factura {inv.invoice_number}
                              </span>
                              <Badge
                                className={
                                  isAnulada
                                    ? "bg-red-100 text-red-800 border-red-200 text-[10px]"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]"
                                }
                              >
                                {isAnulada ? "🚫 Anulada" : "✅ Emitida"}
                              </Badge>
                              <span className="text-zinc-300 hidden sm:inline">•</span>
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {inv.date
                                  ? new Date(inv.date + "T00:00:00").toLocaleDateString("es-PY")
                                  : "Fecha s/d"}
                              </span>
                              <span className="text-zinc-300 hidden sm:inline">•</span>
                              <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded font-medium">
                                {inv.condition}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-700 break-words">
                              <strong className="text-zinc-900">Cliente:</strong> {inv.client?.name}{" "}
                              {inv.client?.document ? (
                                <span className="font-mono text-zinc-500">(RUC: {inv.client.document})</span>
                              ) : null}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                            <div className="flex justify-between items-center sm:block text-left sm:text-right">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Factura</span>
                              <span className="font-mono text-base sm:text-lg font-black text-zinc-900">
                                {formatCurrency(inv.total)}
                              </span>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <DigitalInvoiceModal invoice={inv} />

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                                className="text-xs h-8 px-2"
                                title="Ver presupuestos incluidos"
                              >
                                <Layers className="h-3.5 w-3.5 mr-1 text-zinc-600" />
                                {repairsCount} {repairsCount === 1 ? "orden" : "órdenes"}
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 ml-1 text-zinc-400" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 ml-1 text-zinc-400" />
                                )}
                              </Button>

                              {!isAnulada && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelInvoice(inv)}
                                  disabled={isSubmitting}
                                  className="text-xs h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                  title="Anular factura y devolver presupuestos a Entregado"
                                >
                                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Anular
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desglose Expandible de Presupuestos Incluidos */}
                        {isExpanded && inv.repairs_summary && (
                          <div className="bg-zinc-50 border-t border-zinc-200 p-4 space-y-3 animate-in fade-in text-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
                              Presupuestos y Vehículos agrupados en esta factura:
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {inv.repairs_summary.map((rep, rIdx) => {
                                const v = rep.vehicle

                                return (
                                  <div
                                    key={rIdx}
                                    className="bg-white border border-zinc-200 rounded-lg p-3 space-y-1.5 shadow-2xs"
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <span className="font-mono font-bold text-zinc-800 text-xs">
                                          #PRES-{rep.repair_id ? rep.repair_id.slice(0, 8).toUpperCase() : `${rIdx + 1}`}
                                        </span>
                                        {v && (
                                          <p className="font-medium text-zinc-900 mt-0.5">
                                            🚗 {v.brand} {v.model}{" "}
                                            <span className="font-mono text-zinc-500 font-normal">({v.plate})</span>
                                          </p>
                                        )}
                                      </div>
                                      <span className="font-mono font-bold text-zinc-900 text-xs">
                                        {formatCurrency(rep.budget_total)}
                                      </span>
                                    </div>

                                    <p className="text-zinc-600 text-[11px]">
                                      <strong className="text-zinc-700">Trabajo:</strong> {rep.reason}
                                    </p>

                                    {rep.items && rep.items.length > 0 && (
                                      <div className="pt-1 border-t border-zinc-100 flex flex-wrap gap-1 text-[10px] text-zinc-500">
                                        {rep.items.map((i, iIdx) => (
                                          <span
                                            key={iIdx}
                                            className="bg-zinc-100 rounded px-1.5 py-0.2 border border-zinc-200/60"
                                          >
                                            {i.description} ({i.quantity}x)
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-PESTAÑA B: ÓRDENES INDIVIDUALES */}
          {historySubTab === "ordenes" && (
            <div>
              {filteredInvoicedRepairs.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400 text-xs space-y-2">
                  <Receipt className="h-8 w-8 mx-auto text-zinc-300" />
                  <p className="font-semibold text-zinc-700">No hay órdenes facturadas registradas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Vista Móvil (Cards) */}
                  <div className="md:hidden space-y-3">
                    {filteredInvoicedRepairs.map((r: RepairInvoiceItem) => {
                      const client = r.vehicle?.client
                      const vehicle = r.vehicle

                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs uppercase bg-zinc-100 font-bold"
                                >
                                  #PRES-{r.id.slice(0, 8)}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                                  🧾 Facturado
                                </Badge>
                              </div>
                              {vehicle && (
                                <p className="font-bold text-zinc-900 text-sm mt-1">
                                  {vehicle.brand} {vehicle.model}{" "}
                                  <span className="font-mono text-zinc-500 font-normal text-xs">
                                    ({vehicle.plate})
                                  </span>
                                </p>
                              )}
                            </div>

                            <span className="font-mono text-sm font-bold text-zinc-900 shrink-0">
                              {formatCurrency(r.budget_total || 0)}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                            {client && (
                              <p className="text-zinc-700">
                                <strong>Cliente:</strong> {client.name}{" "}
                                {client.document ? `(RUC: ${client.document})` : ""}
                              </p>
                            )}
                            <p className="text-zinc-600 break-words">
                              <strong>Trabajo:</strong> {r.reason}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 border-t border-zinc-100">
                            <div className="w-full sm:w-auto">
                              <DigitalBudgetModal repair={r} />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevertIndividualRepair(r.id)}
                              disabled={isSubmitting}
                              className="text-zinc-500 hover:text-red-600 text-xs h-8 ml-auto sm:ml-0"
                              title="Revertir a Entregado"
                            >
                              <Undo2 className="h-3 w-3 mr-1" /> Revertir a Entregado
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Vista Desktop (Tabla) */}
                  <div className="hidden md:block bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 text-zinc-700 font-semibold border-b border-zinc-200">
                          <tr>
                            <th className="py-3 px-4">N° Orden</th>
                            <th className="py-3 px-4">Cliente / RUC</th>
                            <th className="py-3 px-4">Vehículo</th>
                            <th className="py-3 px-4">Trabajo Realizado</th>
                            <th className="py-3 px-4">Total Facturado</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {filteredInvoicedRepairs.map((r: RepairInvoiceItem) => {
                            const client = r.vehicle?.client
                            const vehicle = r.vehicle

                            return (
                              <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                                  #PRES-{r.id.slice(0, 8)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-zinc-900 block">{client?.name || "Sin cliente"}</span>
                                  <span className="text-[11px] text-zinc-500">RUC: {client?.document || "S/D"}</span>
                                </td>
                                <td className="py-3 px-4">
                                  {vehicle ? (
                                    <div>
                                      <span className="font-medium text-zinc-800 block">
                                        {vehicle.brand} {vehicle.model}
                                      </span>
                                      <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                                        {vehicle.plate}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400">Sin vehículo</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-zinc-600 max-w-xs truncate">{r.reason}</td>
                                <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                                  {formatCurrency(r.budget_total || 0)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                    🧾 Facturado
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <DigitalBudgetModal repair={r} />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRevertIndividualRepair(r.id)}
                                      disabled={isSubmitting}
                                      className="text-zinc-500 hover:text-red-600 text-xs h-8"
                                      title="Revertir a Entregado"
                                    >
                                      <Undo2 className="h-3 w-3 mr-1" /> Revertir
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
