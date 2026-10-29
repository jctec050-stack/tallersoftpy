"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateVehicleMaintenanceAction } from "@/actions/vehicle-maintenance"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Wrench, Calendar, Gauge, Shield, Check, AlertCircle, Copy, CheckCheck } from "lucide-react"

interface EditMaintenanceModalProps {
  vehicleId: string
  plate: string
  brand: string
  model: string
  currentMileage: number
  initialNextOilKm: number
  initialNextOilDate: string // YYYY-MM-DD
  initialNextDifferentialKm: number
  initialNextFullReviewKm: number
}

export function EditMaintenanceModal({
  vehicleId,
  plate,
  brand,
  model,
  currentMileage,
  initialNextOilKm,
  initialNextOilDate,
  initialNextDifferentialKm,
  initialNextFullReviewKm,
}: EditMaintenanceModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [showSqlNotice, setShowSqlNotice] = useState(false)

  // Form states
  const [mileage, setMileage] = useState<number | string>(currentMileage || 0)
  const [nextOilKm, setNextOilKm] = useState<number | string>(initialNextOilKm || "")
  const [nextOilDate, setNextOilDate] = useState<string>(initialNextOilDate || "")
  const [nextDiffKm, setNextDiffKm] = useState<number | string>(initialNextDifferentialKm || "")
  const [nextFullKm, setNextFullKm] = useState<number | string>(initialNextFullReviewKm || "")

  const sqlMigrationCode = `ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS next_oil_change_km INT,
ADD COLUMN IF NOT EXISTS next_oil_change_date DATE,
ADD COLUMN IF NOT EXISTS next_differential_km INT,
ADD COLUMN IF NOT EXISTS next_full_review_km INT;`

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  // Preset helpers
  const addKmToCurrent = (kmToAdd: number, target: "oil" | "diff" | "full") => {
    const base = Number(mileage) > 0 ? Number(mileage) : 0
    const calculated = base + kmToAdd
    if (target === "oil") setNextOilKm(calculated)
    if (target === "diff") setNextDiffKm(calculated)
    if (target === "full") setNextFullKm(calculated)
  }

  const addMonthsToDate = (months: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() + months)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    setNextOilDate(`${yyyy}-${mm}-${dd}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await updateVehicleMaintenanceAction({
        vehicleId,
        plate,
        currentMileage: mileage !== "" ? Number(mileage) : undefined,
        nextOilChangeKm: nextOilKm !== "" ? Number(nextOilKm) : null,
        nextOilChangeDate: nextOilDate || null,
        nextDifferentialKm: nextDiffKm !== "" ? Number(nextDiffKm) : null,
        nextFullReviewKm: nextFullKm !== "" ? Number(nextFullKm) : null,
      })

      if (!res.success) {
        setError(res.error || "Ocurrió un error al guardar la configuración.")
        setLoading(false)
        return
      }

      setSuccess(true)
      if (res.needsSqlMigration) {
        setShowSqlNotice(true)
      }

      router.refresh()
      setTimeout(() => {
        if (!res.needsSqlMigration) {
          setOpen(false)
          setSuccess(false)
        }
      }, 1200)
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          size="sm"
          className="bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200/80 shadow-xs font-semibold text-xs h-8 px-3 gap-1.5 transition-all"
        />
      }>
        <Wrench className="h-3.5 w-3.5 text-zinc-700" />
        <span>Ajustar Mantenimiento</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white">
              <Shield className="h-4 w-4 text-emerald-400" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900">
                Ajustar Metas de Mantenimiento
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold px-1.5 py-0">
                  {plate}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {brand} {model}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            Control exclusivo para Administradores
          </p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Los valores aquí configurados son persistentes y son los que verá el cliente al escanear la ficha digital del móvil.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>¡Mantenimiento actualizado y guardado correctamente!</span>
          </div>
        )}

        {showSqlNotice && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <p className="font-semibold text-amber-900">
              💡 Guardado local activo. Opcional: sincronizar en Supabase
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Los datos ya quedaron guardados localmente. Si deseas que se almacenen también en columnas dedicadas en Supabase, copia y ejecuta esto en el SQL Editor de tu Dashboard:
            </p>
            <pre className="p-2 rounded bg-amber-100/70 font-mono text-[10px] text-amber-950 overflow-x-auto border border-amber-200">
              {sqlMigrationCode}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySql}
              className="h-7 text-xs bg-white text-zinc-800 border-amber-300"
            >
              {copiedSql ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Copiar comando SQL
                </>
              )}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Kilometraje Actual del Vehículo */}
          <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
            <div className="flex items-center justify-between">
              <Label htmlFor="mileage" className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-zinc-500" />
                Odómetro Actual del Vehículo (km)
              </Label>
              <span className="text-[10px] text-zinc-400 font-mono">Lectura en taller</span>
            </div>
            <Input
              id="mileage"
              type="number"
              min="0"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Ej: 238330"
              className="bg-white font-mono text-sm h-9"
            />
          </div>

          {/* 1. Próximo Cambio de Aceite & Filtros */}
          <div className="space-y-2 p-3 rounded-xl border border-zinc-200/80 bg-white">
            <div className="flex items-center justify-between">
              <Label htmlFor="nextOilKm" className="text-xs font-bold text-zinc-900">
                1. Próximo Aceite Motor (km meta)
              </Label>
              <span className="text-[10px] text-zinc-500">Kilometraje exacto</span>
            </div>
            <Input
              id="nextOilKm"
              type="number"
              min="0"
              value={nextOilKm}
              onChange={(e) => setNextOilKm(e.target.value)}
              placeholder="Ej: 5000 o 245000"
              className="font-mono text-sm h-9"
            />
            {/* Botones rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-400">Atajos rápidos:</span>
              <button
                type="button"
                onClick={() => addKmToCurrent(5000, "oil")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                +5.000 km
              </button>
              <button
                type="button"
                onClick={() => addKmToCurrent(10000, "oil")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                +10.000 km
              </button>
            </div>
          </div>

          {/* 2. Fecha Sugerida para el Próximo Servicio */}
          <div className="space-y-2 p-3 rounded-xl border border-zinc-200/80 bg-white">
            <div className="flex items-center justify-between">
              <Label htmlFor="nextOilDate" className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                2. Fecha Sugerida Próximo Servicio
              </Label>
              <span className="text-[10px] text-zinc-500">Día / Mes / Año</span>
            </div>
            <Input
              id="nextOilDate"
              type="date"
              value={nextOilDate}
              onChange={(e) => setNextOilDate(e.target.value)}
              className="text-sm h-9"
            />
            {/* Botones rápidos fecha */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-400">Atajos de fecha:</span>
              <button
                type="button"
                onClick={() => addMonthsToDate(3)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                +3 meses
              </button>
              <button
                type="button"
                onClick={() => addMonthsToDate(6)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                +6 meses (recomendado)
              </button>
              <button
                type="button"
                onClick={() => addMonthsToDate(12)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                +1 año
              </button>
            </div>
          </div>

          {/* 3. Caja & Diferencial */}
          <div className="space-y-2 p-3 rounded-xl border border-zinc-200/80 bg-white">
            <div className="flex items-center justify-between">
              <Label htmlFor="nextDiffKm" className="text-xs font-bold text-purple-900">
                3. Caja & Diferencial (km meta)
              </Label>
              <span className="text-[10px] text-zinc-500">Transmisión & fluidos</span>
            </div>
            <Input
              id="nextDiffKm"
              type="number"
              min="0"
              value={nextDiffKm}
              onChange={(e) => setNextDiffKm(e.target.value)}
              placeholder="Ej: 40000 o 280000"
              className="font-mono text-sm h-9"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-400">Atajos rápidos:</span>
              <button
                type="button"
                onClick={() => addKmToCurrent(40000, "diff")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
              >
                +40.000 km
              </button>
              <button
                type="button"
                onClick={() => addKmToCurrent(50000, "diff")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
              >
                +50.000 km
              </button>
            </div>
          </div>

          {/* 4. Revisión Completa */}
          <div className="space-y-2 p-3 rounded-xl border border-zinc-200/80 bg-white">
            <div className="flex items-center justify-between">
              <Label htmlFor="nextFullKm" className="text-xs font-bold text-indigo-900">
                4. Revisión Completa (km meta)
              </Label>
              <span className="text-[10px] text-zinc-500">Diagnóstico 25+ puntos</span>
            </div>
            <Input
              id="nextFullKm"
              type="number"
              min="0"
              value={nextFullKm}
              onChange={(e) => setNextFullKm(e.target.value)}
              placeholder="Ej: 20000 o 260000"
              className="font-mono text-sm h-9"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-400">Atajos rápidos:</span>
              <button
                type="button"
                onClick={() => addKmToCurrent(20000, "full")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
              >
                +20.000 km
              </button>
              <button
                type="button"
                onClick={() => addKmToCurrent(30000, "full")}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
              >
                +30.000 km
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="text-xs h-9"
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold h-9 shadow-sm"
            >
              {loading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
