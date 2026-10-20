"use client"

import { useState } from "react"
import { updateBudgetStatus } from "@/actions/budgets"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle2, PackageCheck } from "lucide-react"

type BudgetStatus = "Pendiente" | "Aceptado" | "Entregado" | "Facturado"

interface BudgetStatusToggleProps {
  repairId: string
  currentStatus: string
}

export function BudgetStatusToggle({ repairId, currentStatus }: BudgetStatusToggleProps) {
  // Normalizar el estado actual
  const normalizedStatus = (["Aceptado", "Entregado", "Facturado"].includes(currentStatus) 
    ? currentStatus 
    : "Pendiente") as BudgetStatus

  const [status, setStatus] = useState<BudgetStatus>(normalizedStatus)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: BudgetStatus) => {
    if (newStatus === status || loading) return
    const prevStatus = status
    setStatus(newStatus)
    setLoading(true)

    try {
      await updateBudgetStatus(repairId, newStatus)
    } catch (err: unknown) {
      setStatus(prevStatus)
      const msg = err instanceof Error ? err.message : "No se pudo cambiar el estado del presupuesto"
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  if (status === "Facturado") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-semibold px-2.5 py-1 text-xs">
          🧾 Facturado
        </Badge>
        <button
          type="button"
          onClick={() => handleStatusChange("Entregado")}
          disabled={loading}
          className="text-[11px] text-zinc-500 hover:text-zinc-800 underline transition-colors cursor-pointer"
          title="Revertir estado a Entregado"
        >
          {loading ? "Revertiendo..." : "Deshacer"}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 w-full sm:w-auto">
      {/* Botón Pendiente */}
      <button
        type="button"
        onClick={() => handleStatusChange("Pendiente")}
        disabled={loading}
        className={`w-full sm:w-auto px-1.5 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
          status === "Pendiente"
            ? "bg-amber-500 text-white shadow-xs"
            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
        }`}
        title="Marcar como Pendiente"
      >
        <Clock className="h-3 w-3 shrink-0" />
        <span>Pendiente</span>
      </button>

      {/* Botón Aceptado */}
      <button
        type="button"
        onClick={() => handleStatusChange("Aceptado")}
        disabled={loading}
        className={`w-full sm:w-auto px-1.5 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
          status === "Aceptado"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
        }`}
        title="Marcar como Aceptado"
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Aceptado</span>
      </button>

      {/* Botón Entregado */}
      <button
        type="button"
        onClick={() => handleStatusChange("Entregado")}
        disabled={loading}
        className={`w-full sm:w-auto px-1.5 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
          status === "Entregado"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
        }`}
        title="Marcar como Entregado"
      >
        <PackageCheck className="h-3 w-3 shrink-0" />
        <span>Entregado</span>
      </button>

      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500 ml-1 hidden sm:inline-block" />}
    </div>
  )
}
