"use client"

import { useState, useRef, useEffect } from "react"
import { updateRepairStatus } from "@/actions/repairs"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronDown, Check, Clock, Search, FileText, Wrench, CheckCircle2, Car, ArrowRight } from "lucide-react"

export type RepairStatus =
  | "Pendiente"
  | "En Diagnóstico"
  | "Presupuestado"
  | "En Reparación"
  | "Completado"
  | "Entregado"

export const REPAIR_STATUS_LIST: {
  value: RepairStatus
  label: string
  icon: any
  badgeClass: string
  description: string
  step: number
}[] = [
  {
    value: "Pendiente",
    label: "Pendiente",
    icon: Clock,
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200",
    description: "Ingresado, a la espera de revisión",
    step: 1,
  },
  {
    value: "En Diagnóstico",
    label: "En Diagnóstico",
    icon: Search,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100",
    description: "Revisión técnica en proceso",
    step: 2,
  },
  {
    value: "Presupuestado",
    label: "Presupuestado",
    icon: FileText,
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100",
    description: "Cotización enviada o aprobada",
    step: 3,
  },
  {
    value: "En Reparación",
    label: "En Reparación",
    icon: Wrench,
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100",
    description: "Trabajo mecánico en ejecución",
    step: 4,
  },
  {
    value: "Completado",
    label: "Completado",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
    description: "Trabajo terminado, listo para entrega",
    step: 5,
  },
  {
    value: "Entregado",
    label: "Entregado",
    icon: Car,
    badgeClass: "bg-zinc-900 text-zinc-100 border-zinc-950 hover:bg-zinc-800",
    description: "Vehículo entregado al cliente",
    step: 6,
  },
]

interface RepairStatusSelectProps {
  repairId: string
  currentStatus: string
  variant?: "badge" | "stepper"
}

export function RepairStatusSelect({
  repairId,
  currentStatus,
  variant = "badge",
}: RepairStatusSelectProps) {
  const [status, setStatus] = useState<RepairStatus>(
    (REPAIR_STATUS_LIST.find((s) => s.value === currentStatus)?.value || "Pendiente") as RepairStatus
  )
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelectStatus = async (newStatus: RepairStatus) => {
    if (newStatus === status || loading) {
      setIsOpen(false)
      return
    }

    const previousStatus = status
    setStatus(newStatus)
    setIsOpen(false)
    setLoading(true)

    try {
      await updateRepairStatus(repairId, newStatus)
    } catch (err: any) {
      setStatus(previousStatus)
      alert(err.message || "Error al actualizar el estado de la reparación")
    } finally {
      setLoading(false)
    }
  }

  const currentConfig = REPAIR_STATUS_LIST.find((s) => s.value === status) || REPAIR_STATUS_LIST[0]
  const CurrentIcon = currentConfig.icon

  // Render Stepper Variant (para la página de detalle)
  if (variant === "stepper") {
    const currentStep = currentConfig.step

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Estado de la Orden:
            </span>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs ${currentConfig.badgeClass}`}
                title="Haz clic para cambiar el estado"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CurrentIcon className="h-3 w-3 shrink-0" />
                )}
                <span>{status}</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </button>

              {isOpen && (
                <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/10 z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Cambiar estado rápido
                  </div>
                  {REPAIR_STATUS_LIST.map((item) => {
                    const ItemIcon = item.icon
                    const isSelected = item.value === status
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleSelectStatus(item.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-zinc-100 font-semibold text-zinc-900" : "hover:bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className="h-3.5 w-3.5 text-zinc-500" />
                          <div>
                            <p className="leading-tight">{item.label}</p>
                            <p className="text-[10px] text-zinc-400 leading-tight">{item.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-zinc-800" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <span className="text-[11px] text-zinc-400">
            Paso {currentStep} de {REPAIR_STATUS_LIST.length}
          </span>
        </div>

        {/* Stepper visual interactivo */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {REPAIR_STATUS_LIST.map((item) => {
            const ItemIcon = item.icon
            const isCurrent = item.value === status
            const isCompleted = item.step < currentStep

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelectStatus(item.value)}
                disabled={loading}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-sm ring-2 ring-zinc-900/20"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/60"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
                title={`Cambiar a: ${item.label}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <ItemIcon
                    className={`h-4 w-4 ${
                      isCurrent ? "text-white" : isCompleted ? "text-emerald-600" : "text-zinc-400"
                    }`}
                  />
                  {isCompleted && <Check className="h-3 w-3 text-emerald-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">{item.label}</p>
                  <p
                    className={`text-[10px] mt-0.5 leading-tight line-clamp-1 ${
                      isCurrent ? "text-zinc-300" : "text-zinc-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Variant Badge (para la tabla de reparaciones)
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none shadow-xs ${currentConfig.badgeClass}`}
        title="Haz clic para cambiar el estado de la orden"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
        ) : (
          <CurrentIcon className="h-3 w-3 shrink-0" />
        )}
        <span>{status}</span>
        <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/10 z-50 text-xs animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
            Cambiar estado
          </div>
          <div className="space-y-0.5">
            {REPAIR_STATUS_LIST.map((item) => {
              const ItemIcon = item.icon
              const isSelected = item.value === status
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelectStatus(item.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? "bg-zinc-100 font-semibold text-zinc-900" : "hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ItemIcon className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-zinc-900" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
