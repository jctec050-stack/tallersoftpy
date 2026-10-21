"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRepair, updateRepair, RepairData, BudgetItem } from "@/actions/repairs"
import { getVehicles, updateVehicle } from "@/actions/vehicles"
import { getMechanics } from "@/actions/mechanics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Image as ImageIcon, FileText, Calendar, Wrench, AlertCircle, X, UserCheck, Sparkles, Gauge, Package } from "lucide-react"
import { BudgetServiceAutocomplete } from "@/components/budgets/BudgetServiceAutocomplete"
import { saveLocalCachedService } from "@/lib/budget-cache"

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
  mileage?: number
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
  const [newItemInventoryId, setNewItemInventoryId] = useState<string | null>(null)
  const [newItemStock, setNewItemStock] = useState<number | null>(null)

  // Manejo dinámico del kilometraje del vehículo
  const [vehicleMileage, setVehicleMileage] = useState<string>(
    initialData?.vehicle?.mileage !== undefined && initialData?.vehicle?.mileage !== null
      ? initialData.vehicle.mileage.toString()
      : ""
  )

  const isEditing = !!initialData?.id

  // Cargar lista de vehículos y mecánicos
  useEffect(() => {
    getVehicles().then(res => {
      if (res.vehicles) {
        setVehicles(res.vehicles)
        // Si hay un vehículo preseleccionado o inicial y el estado de kilometraje está vacío, cargarlo
        const targetId = initialData?.vehicle_id || preselectedVehicleId
        if (targetId) {
          const match = res.vehicles.find((v: any) => v.id === targetId)
          if (match && match.mileage !== undefined && match.mileage !== null) {
            setVehicleMileage(prev => (prev === "" ? match.mileage.toString() : prev))
          }
        }
      }
      setLoadingVehicles(false)
    }).catch(() => setLoadingVehicles(false))

    getMechanics().then(res => {
      if (res.mechanics) {
        setMechanics(res.mechanics.filter((m: any) => m.status === "Activo" || m.id === initialData?.mechanic_id))
      }
      setLoadingMechanics(false)
    }).catch(() => setLoadingMechanics(false))
  }, [initialData, preselectedVehicleId])

  const defaultDate = initialData?.entry_date 
    ? new Date(initialData.entry_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RepairFormValues>({
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

  const selectedVehicleId = watch("vehicle_id")
  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId)

  // Cargar el kilometraje predeterminado cuando se selecciona un vehículo
  useEffect(() => {
    if (currentVehicle) {
      if (currentVehicle.mileage !== undefined && currentVehicle.mileage !== null) {
        setVehicleMileage(currentVehicle.mileage.toString())
      } else {
        setVehicleMileage("")
      }
    }
  }, [currentVehicle?.id])

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

  // Cargar ítems presupuestados existentes en la caché local
  useEffect(() => {
    if (initialData?.budget_items && Array.isArray(initialData.budget_items)) {
      initialData.budget_items.forEach((item) => {
        if (item.description && item.price !== undefined) {
          saveLocalCachedService({
            description: item.description,
            price: item.price,
            quantity: item.quantity || 1
          })
        }
      })
    }
  }, [initialData])

  // Funciones para presupuesto con predicción y caché inteligente
  const addBudgetItem = (overrideItem?: {
    description: string
    price: number
    quantity: number
    inventory_id?: string | null
    stock?: number
  }) => {
    const desc = overrideItem ? overrideItem.description : newItemDesc
    const qty = overrideItem ? overrideItem.quantity : newItemQty
    const priceNum = overrideItem ? overrideItem.price : parseFloat(newItemPrice) || 0
    const invId = overrideItem ? overrideItem.inventory_id : newItemInventoryId

    if (desc.trim() && qty > 0 && priceNum >= 0) {
      const item: BudgetItem = {
        id: Date.now().toString(),
        description: desc.trim(),
        quantity: qty,
        price: priceNum,
        total: qty * priceNum,
        inventory_id: invId || null,
        item_type: invId ? "part" : "service"
      }
      setBudgetItems((prev) => [...prev, item])

      // Guardar en la caché local para predecir en futuros presupuestos
      saveLocalCachedService({
        description: desc.trim(),
        price: priceNum,
        quantity: qty,
        inventory_id: invId || null
      })

      if (!overrideItem) {
        setNewItemDesc("")
        setNewItemQty(1)
        setNewItemPrice("")
        setNewItemInventoryId(null)
        setNewItemStock(null)
      }
    }
  }

  const handleSelectSuggestedService = (service: {
    description: string
    price: number
    quantity: number
    inventory_id?: string | null
    stock?: number
  }) => {
    setNewItemDesc(service.description)
    setNewItemPrice(service.price !== undefined ? service.price.toString() : "")
    setNewItemQty(service.quantity || 1)
    setNewItemInventoryId(service.inventory_id || null)
    setNewItemStock(service.stock ?? null)
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

      // Actualizar kilometraje del vehículo si se ingresó o modificó
      if (values.vehicle_id && vehicleMileage.trim() !== "" && !isNaN(Number(vehicleMileage))) {
        try {
          await updateVehicle(values.vehicle_id, {
            mileage: Number(vehicleMileage)
          })
        } catch (vErr) {
          console.error("Error al actualizar kilometraje del vehículo:", vErr)
        }
      }

      // Guardar todos los ítems presupuestados en la caché para aprendizaje continuo
      budgetItems.forEach((bItem) => {
        if (bItem.description && bItem.price !== undefined) {
          saveLocalCachedService({
            description: bItem.description,
            price: bItem.price,
            quantity: bItem.quantity || 1
          })
        }
      })

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

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4 space-y-2">
            <Label htmlFor="entry_date">Fecha de Ingreso</Label>
            <Input id="entry_date" type="date" {...register("entry_date")} />
            {errors.entry_date && <p className="text-red-500 text-xs">{errors.entry_date.message}</p>}
          </div>

          <div className="sm:col-span-5 space-y-2">
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

          <div className="sm:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vehicle_mileage" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Gauge className="h-3.5 w-3.5 text-zinc-600" />
                Kilometraje
              </Label>
              {currentVehicle && currentVehicle.mileage !== undefined && currentVehicle.mileage !== null && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {currentVehicle.mileage.toLocaleString()} km
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="vehicle_mileage"
                type="number"
                placeholder={currentVehicle ? "Ej: 150000" : "km..."}
                value={vehicleMileage}
                min={0}
                onChange={(e) => setVehicleMileage(e.target.value)}
                className="font-mono text-xs pr-8 h-9 bg-white"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 font-medium pointer-events-none">
                km
              </span>
            </div>
            {currentVehicle && (
              <p className="text-[10px] text-zinc-500 truncate">
                {vehicleMileage && Number(vehicleMileage) !== currentVehicle.mileage ? (
                  <span className="text-amber-600 font-medium">
                    Actualizará a {Number(vehicleMileage).toLocaleString()} km
                  </span>
                ) : (
                  <span>Predeterminado (editable)</span>
                )}
              </p>
            )}
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

        {/* Carga de nuevo ítem con predicción y caché inteligente */}
        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Ítem / Servicio Presupuestado
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              Predicción con precio y cantidad histórica
            </span>
          </div>

          <BudgetServiceAutocomplete 
            value={newItemDesc}
            onChange={(val) => {
              setNewItemDesc(val)
              if (!val) {
                setNewItemInventoryId(null)
                setNewItemStock(null)
              }
            }}
            onSelectService={handleSelectSuggestedService}
            onAddDirectly={(svc) => addBudgetItem(svc)}
            placeholder="Escribe para predecir (ej. Mantenimiento, Aceite, Frenos...)"
          />

          {/* Aviso si se vinculó un repuesto del inventario */}
          {newItemInventoryId && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1.5 rounded-md text-[11px] animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>
                  Repuesto vinculado al inventario (Stock disponible: <strong className="font-mono">{newItemStock ?? 0} un.</strong>). Se descontará del stock.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewItemInventoryId(null)
                  setNewItemStock(null)
                }}
                className="text-[10px] text-blue-700 hover:text-blue-900 underline ml-2 shrink-0 font-medium"
              >
                Desvincular
              </button>
            </div>
          )}

          {/* Accesos rápidos frecuentes */}
          {!newItemDesc && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] text-zinc-500">
              <span className="text-[10px] text-zinc-400 shrink-0">Frecuentes:</span>
              {[
                { name: "Mantenimiento preventivo", price: 250000 },
                { name: "Cambio de aceite y filtro", price: 220000 },
                { name: "Pastillas de freno", price: 180000 },
                { name: "Alineación y balanceo", price: 120000 },
              ].map((quick) => (
                <button
                  key={quick.name}
                  type="button"
                  onClick={() => handleSelectSuggestedService({ description: quick.name, price: quick.price, quantity: 1 })}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 shrink-0 transition-colors text-[10px]"
                >
                  <span>+ {quick.name}</span>
                  <span className="text-emerald-600 font-mono text-[9px]">₲ {quick.price / 1000}k</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4 sm:col-span-3">
              <label className="block text-[10px] text-zinc-500 mb-0.5 font-medium">Cantidad</label>
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
              <label className="block text-[10px] text-zinc-500 mb-0.5 font-medium">Precio Unitario (₲)</label>
              <Input 
                type="number"
                placeholder="Precio ₲" 
                value={newItemPrice}
                min={0}
                onChange={(e) => setNewItemPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addBudgetItem()
                  }
                }}
                className="h-9 text-xs bg-white font-mono"
              />
            </div>
            <div className="col-span-3 flex items-end">
              <Button type="button" size="sm" onClick={() => addBudgetItem()} className="w-full h-9 bg-zinc-900 text-white text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ítem
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de ítems presupuestados */}
        {/* Lista de ítems presupuestados */}
        {budgetItems.length > 0 && (
          <div className="space-y-2">
            {/* 1. Vista Móvil (Cards) */}
            <div className="block sm:hidden space-y-2">
              {budgetItems.map((item, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 rounded-lg p-2.5 space-y-1.5 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-zinc-900 text-xs leading-snug">{item.description}</span>
                      {item.inventory_id && (
                        <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded inline-flex items-center gap-0.5">
                          <Package className="h-2.5 w-2.5" /> Stock
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBudgetItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1 -mr-1 -mt-1"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <span>Cant: <strong className="text-zinc-700">{item.quantity}</strong> × {formatCurrency(item.price)}</span>
                    <span className="font-bold text-zinc-900 font-mono text-xs">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Vista Desktop (Tabla) */}
            <div className="hidden sm:block border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
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
                      <td className="p-2 font-medium text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.description}</span>
                          {item.inventory_id && (
                            <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                              <Package className="h-2.5 w-2.5 text-blue-600" /> Repuesto de Inventario
                            </span>
                          )}
                        </div>
                      </td>
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
              </table>
            </div>

            {/* Total Presupuestado */}
            <div className="flex justify-between items-center bg-zinc-900 text-white rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-bold">
              <span className="uppercase tracking-wider text-[11px] text-zinc-300">Total Presupuestado:</span>
              <span className="text-emerald-400 font-mono sm:text-base">{formatCurrency(totalBudgetCalculated)}</span>
            </div>
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
