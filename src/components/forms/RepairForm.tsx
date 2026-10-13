"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRepair, updateRepair, RepairData, BudgetItem } from "@/actions/repairs"
import { getVehicles } from "@/actions/vehicles"
import { getMechanics } from "@/actions/mechanics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Image as ImageIcon, FileText, Calendar, Wrench, AlertCircle, X, UserCheck } from "lucide-react"

const repairSchema = z.object({
  entry_date: z.string().min(1, "Fecha de ingreso requerida"),
  vehicle_id: z.string().min(1, "Debes seleccionar un vehículo"),
  mechanic_id: z.string().optional(),
  reason: z.string().min(3, "El motivo de ingreso es requerido"),
  diagnosis: z.string().optional(),
  priority: z.enum(["Baja", "Media", "Alta"]),
  status: z.enum(["Pendiente", "En Diagnóstico", "Presupuestado", "En Reparación", "Completado", "Entregado"]),
  budget_status: z.enum(["Borrador", "Enviado", "Aprobado", "Rechazado"]).optional(),
})

type RepairFormValues = z.infer<typeof repairSchema>

interface VehicleOption {
  id: string
  plate: string
  brand: string
  model: string
  client?: {
    name: string
  }
}

interface MechanicOption {
  id: string
  name: string
  specialty?: string
  status?: string
}

interface RepairFormProps {
  initialData?: RepairData
  preselectedVehicleId?: string
  onSuccess?: () => void
}

export function RepairForm({ initialData, preselectedVehicleId, onSuccess }: RepairFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [mechanics, setMechanics] = useState<MechanicOption[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingMechanics, setLoadingMechanics] = useState(true)

  // Manejo dinámico de fotos antes de reparar
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialData?.photos || [])
  const [newPhotoInput, setNewPhotoInput] = useState("")

  // Manejo dinámico del Presupuesto Digital
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialData?.budget_items || [])
  const [newItemDesc, setNewItemDesc] = useState("")
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemPrice, setNewItemPrice] = useState("")

  const isEditing = !!initialData?.id

  // Cargar lista de vehículos y mecánicos
  useEffect(() => {
    getVehicles().then(res => {
      if (res.vehicles) {
        setVehicles(res.vehicles)
      }
      setLoadingVehicles(false)
    }).catch(() => setLoadingVehicles(false))

    getMechanics().then(res => {
      if (res.mechanics) {
        setMechanics(res.mechanics.filter((m: any) => m.status === "Activo" || m.id === initialData?.mechanic_id))
      }
      setLoadingMechanics(false)
    }).catch(() => setLoadingMechanics(false))
  }, [initialData])

  const defaultDate = initialData?.entry_date 
    ? new Date(initialData.entry_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RepairFormValues>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      entry_date: defaultDate,
      vehicle_id: initialData?.vehicle_id || preselectedVehicleId || "",
      mechanic_id: initialData?.mechanic_id || "",
      reason: initialData?.reason || "",
      diagnosis: initialData?.diagnosis || "",
      priority: initialData?.priority || "Media",
      status: initialData?.status || "Pendiente",
      budget_status: initialData?.budget_status || "Borrador",
    }
  })

  // Funciones para agregar/quitar fotos
  const addPhoto = () => {
    if (newPhotoInput.trim()) {
      setPhotoUrls([...photoUrls, newPhotoInput.trim()])
      setNewPhotoInput("")
    }
  }

  const removePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  // Funciones para presupuesto
  const addBudgetItem = () => {
    const priceNum = parseFloat(newItemPrice) || 0
    if (newItemDesc.trim() && newItemQty > 0 && priceNum >= 0) {
      const item: BudgetItem = {
        id: Date.now().toString(),
        description: newItemDesc.trim(),
        quantity: newItemQty,
        price: priceNum,
        total: newItemQty * priceNum
      }
      setBudgetItems([...budgetItems, item])
      setNewItemDesc("")
      setNewItemQty(1)
      setNewItemPrice("")
    }
  }

  const removeBudgetItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index))
  }

  const totalBudgetCalculated = budgetItems.reduce((sum, item) => sum + item.total, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  const onSubmit = async (values: RepairFormValues) => {
    try {
      setError(null)
      const payload: RepairData = {
        ...values,
        mechanic_id: values.mechanic_id || null,
        photos: photoUrls,
        budget_items: budgetItems,
        budget_total: totalBudgetCalculated,
        budget_status: values.budget_status || "Borrador",
      }

      if (isEditing && initialData?.id) {
        await updateRepair(initialData.id, payload)
      } else {
        await createRepair(payload)
      }

      if (onSuccess) onSuccess()
      else router.refresh()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    } catch (err: any) {
      setError(err.message || "Error al procesar la orden de reparación")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* 1. Datos Principales */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 border-b pb-1.5 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-zinc-500" /> Información de Ingreso
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entry_date">Fecha de Ingreso</Label>
            <Input id="entry_date" type="date" {...register("entry_date")} />
            {errors.entry_date && <p className="text-red-500 text-xs">{errors.entry_date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehículo / Propietario</Label>
            <select
              id="vehicle_id"
              {...register("vehicle_id")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{loadingVehicles ? "Cargando vehículos..." : "-- Seleccionar Vehículo --"}</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  [{v.plate}] {v.brand} {v.model} {v.client?.name ? `- (${v.client.name})` : ""}
                </option>
              ))}
            </select>
            {errors.vehicle_id && <p className="text-red-500 text-xs">{errors.vehicle_id.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mechanic_id">Mecánico Asignado</Label>
            <select
              id="mechanic_id"
              {...register("mechanic_id")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Sin asignar --</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.specialty || "Mecánico"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad de Trabajo</Label>
            <select
              id="priority"
              {...register("priority")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Baja">🟢 Baja Prioridad</option>
              <option value="Media">🟡 Media Prioridad</option>
              <option value="Alta">🔴 Alta Prioridad</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado del Trabajo</Label>
            <select
              id="status"
              {...register("status")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Diagnóstico">En Diagnóstico</option>
              <option value="Presupuestado">Presupuestado</option>
              <option value="En Reparación">En Reparación</option>
              <option value="Completado">Completado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo de Ingreso / Falla Reportada</Label>
          <Textarea id="reason" {...register("reason")} placeholder="Describa el motivo por el cual ingresa el vehículo..." rows={2} />
          {errors.reason && <p className="text-red-500 text-xs">{errors.reason.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnóstico Técnico (Opcional)</Label>
          <Textarea id="diagnosis" {...register("diagnosis")} placeholder="Hallazgos del mecánico, pruebas realizadas o solución requerida..." rows={2} />
        </div>
      </div>

      {/* 2. Fotos Antes de Reparar */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-zinc-900 border-b pb-1.5 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-zinc-500" /> Fotos Antes de Reparar
        </h3>
        <p className="text-xs text-zinc-500">Agrega URLs de imágenes del estado inicial del vehículo (rayones, golpes, motor).</p>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Pegar URL de la foto (ej: https://...)" 
            value={newPhotoInput} 
            onChange={(e) => setNewPhotoInput(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={addPhoto}>
            <Plus className="h-4 w-4 mr-1" /> Añadir
          </Button>
        </div>

        {photoUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {photoUrls.map((url, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 flex items-center justify-center">
                <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  title="Eliminar foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Presupuesto Digital */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center border-b pb-1.5">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" /> Presupuesto Digital
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Estado Presupuesto:</span>
            <select 
              id="budget_status" 
              {...register("budget_status")} 
              className="text-xs rounded border border-input bg-background px-2 py-1 font-medium"
            >
              <option value="Borrador">Borrador</option>
              <option value="Enviado">Enviado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Carga de nuevo ítem */}
        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2">
          <Input 
            placeholder="Descripción (ej. Cambio de aceite, Pastillas)" 
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            className="h-9 text-xs w-full bg-white"
          />
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4 sm:col-span-3">
              <Input 
                type="number"
                placeholder="Cant." 
                value={newItemQty}
                min={1}
                onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                className="h-9 text-xs text-center bg-white"
              />
            </div>
            <div className="col-span-5 sm:col-span-6">
              <Input 
                type="number"
                placeholder="Precio ₲" 
                value={newItemPrice}
                min={0}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>
            <div className="col-span-3">
              <Button type="button" size="sm" onClick={addBudgetItem} className="w-full h-9 bg-zinc-900 text-white text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ítem
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de ítems presupuestados */}
        {budgetItems.length > 0 && (
          <div className="border rounded-lg overflow-x-auto text-xs">
            <table className="w-full text-left min-w-[340px]">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b">
                <tr>
                  <th className="p-2">Ítem / Servicio</th>
                  <th className="p-2 text-center">Cant.</th>
                  <th className="p-2 text-right">Unitario</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {budgetItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2 font-medium text-zinc-900">{item.description}</td>
                    <td className="p-2 text-center text-zinc-600">{item.quantity}</td>
                    <td className="p-2 text-right text-zinc-600">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-right font-semibold text-zinc-900">{formatCurrency(item.total)}</td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => removeBudgetItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-900 text-white font-bold">
                <tr>
                  <td colSpan={3} className="p-2.5 text-right uppercase tracking-wider text-[11px]">Total Presupuestado:</td>
                  <td className="p-2.5 text-right text-emerald-400 text-sm">{formatCurrency(totalBudgetCalculated)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
          {isSubmitting ? "Guardando Orden..." : isEditing ? "Actualizar Orden de Reparación" : "Crear Orden de Reparación"}
        </Button>
      </div>
    </form>
  )
}
