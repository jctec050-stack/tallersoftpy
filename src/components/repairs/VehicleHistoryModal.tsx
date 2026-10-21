"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getVehicleRepairHistory } from "@/actions/repairs"
import { History, Car, Calendar, Wrench, FileText, CheckCircle2, Clock, Loader2, Gauge } from "lucide-react"

interface RepairHistoryItem {
  id: string
  entry_date: string
  reason: string
  diagnosis?: string
  priority: string
  status: string
  budget_total?: number
  created_at?: string
  mileage?: number | null
}

interface VehicleHistoryProps {
  vehicleId: string
  plate?: string
  brand?: string
  model?: string
}

export function VehicleHistoryModal({ vehicleId, plate, brand, model }: VehicleHistoryProps) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<RepairHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && vehicleId) {
      setLoading(true)
      getVehicleRepairHistory(vehicleId)
        .then(res => {
          setHistory(res || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [open, vehicleId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Alta Prioridad</Badge>
      case "Media":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Media Prioridad</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Baja Prioridad</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-zinc-600 border-zinc-200 hover:bg-zinc-50" />}>
        <History className="mr-1.5 h-4 w-4 text-zinc-500" /> Historial
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <History className="h-5 w-5 text-zinc-700" /> Historial de Reparaciones {plate ? `(${plate})` : ""}
          </DialogTitle>
        </DialogHeader>

        {brand && model && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-zinc-500" /> {brand} {model}
            </span>
            <span className="font-mono text-zinc-500">Chapa: {plate}</span>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando historial del vehículo...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl">
              <History className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="font-medium text-zinc-700 text-sm">Sin historial de reparaciones previas</p>
              <p className="text-xs text-zinc-400 mt-1">Este vehículo aún no tiene registros de ingresos anteriores.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-zinc-200 space-y-6">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Icon */}
                  <div className="absolute -left-[31px] top-0 bg-white border-2 border-zinc-900 rounded-full p-1 text-zinc-900">
                    <Wrench className="h-3 w-3" />
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-2 hover:border-zinc-300 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Ingreso: {new Date(item.entry_date).toLocaleDateString("es-PY")}</span>
                          </span>
                          {item.mileage !== undefined && item.mileage !== null && Number(item.mileage) > 0 && (
                            <>
                              <span className="text-zinc-300">•</span>
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-700 bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-[11px]">
                                <Gauge className="h-3 w-3 text-zinc-500" />
                                <span>{Number(item.mileage).toLocaleString()} km</span>
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-semibold text-zinc-900 text-sm mt-1">{item.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getPriorityBadge(item.priority)}
                        <Badge variant="outline" className="text-[10px] bg-zinc-50 font-normal">
                          {item.status}
                        </Badge>
                      </div>
                    </div>

                    {item.diagnosis && (
                      <div className="text-xs bg-zinc-50 p-2.5 rounded-md border border-zinc-100 text-zinc-700">
                        <strong className="text-zinc-900 block mb-0.5">Diagnóstico:</strong>
                        {item.diagnosis}
                      </div>
                    )}

                    {item.budget_total !== undefined && item.budget_total > 0 && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-100 text-zinc-600">
                        <span>Total Reparación:</span>
                        <span className="font-bold text-zinc-900">{formatCurrency(item.budget_total)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
