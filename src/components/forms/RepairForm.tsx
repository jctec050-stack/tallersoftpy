"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRepair, updateRepair, RepairData, BudgetItem } from "@/actions/repairs"
import { getVehicles, updateVehicle } from "@/actions/vehicles"
import { getClients } from "@/actions/clients"
import { getMechanics } from "@/actions/mechanics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Calendar, 
  Wrench, 
  AlertCircle, 
  X, 
  UserCheck, 
  Sparkles, 
  Gauge, 
  Package,
  Car,
  User,
  Search,
  ChevronDown,
  Check
} from "lucide-react"
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
  year?: number
  mileage?: number
  client_id?: string
  client?: {
    id?: string
    name: string
    document?: string
    phone?: string
  }
}

interface ClientOption {
  id: string
  name: string
  document?: string | null
  phone?: string | null
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
  const [clients, setClients] = useState<ClientOption[]>([])
  const [mechanics, setMechanics] = useState<MechanicOption[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMechanics, setLoadingMechanics] = useState(true)

  // Selector de propietario
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const clientDropdownRef = useRef<HTMLDivElement>(null)

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

  // Cerrar dropdown de propietarios al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cargar lista de vehículos, clientes y mecánicos
  useEffect(() => {
    setLoadingVehicles(true)
    setLoadingClients(true)
    setLoadingMechanics(true)

    Promise.all([getVehicles(), getClients(), getMechanics()])
      .then(([vehRes, cliRes, mecRes]) => {
        let loadedVehicles: VehicleOption[] = []
        if (vehRes.vehicles) {
          loadedVehicles = vehRes.vehicles
          setVehicles(loadedVehicles)
        }
        if (cliRes.clients) {
          setClients(cliRes.clients)
        }
        if (mecRes.mechanics) {
          setMechanics(mecRes.mechanics.filter((m: any) => m.status === "Activo" || m.id === initialData?.mechanic_id))
        }

        // Si hay un vehículo preseleccionado o inicial y el estado de kilometraje está vacío, cargarlo
        const targetId = initialData?.vehicle_id || preselectedVehicleId
        if (targetId && loadedVehicles.length > 0) {
          const match = loadedVehicles.find((v: any) => v.id === targetId)
          if (match) {
            if (match.mileage !== undefined && match.mileage !== null) {
              setVehicleMileage(prev => (prev === "" ? match.mileage!.toString() : prev))
            }
            const ownerId = match.client_id || match.client?.id
            if (ownerId) {
              setSelectedClientId(ownerId)
            }
          }
        } else if (initialData?.vehicle?.client?.id) {
          setSelectedClientId(initialData.vehicle.client.id)
        }

        setLoadingVehicles(false)
        setLoadingClients(false)
        setLoadingMechanics(false)
      })
      .catch(() => {
        setLoadingVehicles(false)
        setLoadingClients(false)
        setLoadingMechanics(false)
      })
  }, [initialData, preselectedVehicleId])

  const defaultDate = initialData?.entry_date 
    ? new Date(initialData.entry_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RepairFormValues>({
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

  // Cliente seleccionado
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null
    const found = clients.find(c => c.id === selectedClientId)
    if (found) return found
    const vMatch = vehicles.find(v => (v.client_id === selectedClientId || v.client?.id === selectedClientId))
    if (vMatch?.client) {
      return {
        id: selectedClientId,
        name: vMatch.client.name,
        document: vMatch.client.document,
        phone: vMatch.client.phone,
      }
    }
    return null
  }, [clients, vehicles, selectedClientId])

  // Vehículos pertenecientes al propietario seleccionado
  const clientVehicles = useMemo(() => {
    if (!selectedClientId) return []
    return vehicles.filter(v => (v.client_id === selectedClientId) || (v.client?.id === selectedClientId))
  }, [vehicles, selectedClientId])

  // Lista combinada y filtrada de clientes para el buscador
  const filteredClients = useMemo(() => {
    const map = new Map<string, ClientOption>()
    clients.forEach(c => map.set(c.id, c))
    vehicles.forEach(v => {
      const oId = v.client_id || v.client?.id
      if (oId && !map.has(oId) && v.client) {
        map.set(oId, {
          id: oId,
          name: v.client.name,
          document: v.client.document,
          phone: v.client.phone,
        })
      }
    })
    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"))
    if (!clientSearchQuery.trim()) return list
    const q = clientSearchQuery.toLowerCase().trim()
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      (c.document && c.document.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    )
  }, [clients, vehicles, clientSearchQuery])

  // Manejador al seleccionar un propietario
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId)
    setIsClientDropdownOpen(false)
    setClientSearchQuery("")

    const ownerVehicles = vehicles.filter(
      v => (v.client_id === clientId) || (v.client?.id === clientId)
    )

    if (ownerVehicles.length === 1) {
      const autoVeh = ownerVehicles[0]
      setValue("vehicle_id", autoVeh.id, { shouldValidate: true })
      if (autoVeh.mileage !== undefined && autoVeh.mileage !== null) {
        setVehicleMileage(autoVeh.mileage.toString())
      } else {
        setVehicleMileage("")
      }
    } else {
      const currentVehId = watch("vehicle_id")
      const belongs = ownerVehicles.some(v => v.id === currentVehId)
      if (!belongs) {
        setValue("vehicle_id", "", { shouldValidate: true })
        setVehicleMileage("")
      }
    }
  }

  // Manejador para deseleccionar / cambiar propietario
  const handleClearClient = () => {
    setSelectedClientId("")
    setValue("vehicle_id", "", { shouldValidate: true })
    setVehicleMileage("")
    setClientSearchQuery("")
  }

  // Registro del campo de vehículo para react-hook-form
  const vehicleRegistration = register("vehicle_id")

  // Manejador al cambiar de vehículo
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    vehicleRegistration.onChange(e)
    const vId = e.target.value
    setValue("vehicle_id", vId, { shouldValidate: true })
    if (!vId) {
      setVehicleMileage("")
      return
    }
    const match = vehicles.find(v => v.id === vId)
    if (match) {
      const ownerId = match.client_id || match.client?.id
      if (ownerId && ownerId !== selectedClientId) {
        setSelectedClientId(ownerId)
      }
      if (match.mileage !== undefined && match.mileage !== null) {
        setVehicleMileage(match.mileage.toString())
      } else {
        setVehicleMileage("")
      }
    }
  }

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
      const parsedMileage = vehicleMileage.trim() !== "" && !isNaN(Number(vehicleMileage))
        ? Number(vehicleMileage)
        : undefined

      const payload: RepairData = {
        ...values,
        mechanic_id: values.mechanic_id || null,
        photos: photoUrls,
        budget_items: budgetItems,
        budget_total: totalBudgetCalculated,
        budget_status: values.budget_status || "Borrador",
        mileage: parsedMileage,
      }

      if (isEditing && initialData?.id) {
        await updateRepair(initialData.id, payload)
      } else {
        await createRepair(payload)
      }

      // Actualizar kilometraje del vehículo si se ingresó o modificó
      if (values.vehicle_id && parsedMileage !== undefined) {
        try {
          await updateVehicle(values.vehicle_id, {
            mileage: parsedMileage
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> <span className="min-w-0 flex-1">{error}</span>
        </div>
      )}

      {/* 1. Datos Principales */}
      <div className="space-y-4 min-w-0">
        <h3 className="text-sm font-semibold text-zinc-900 border-b pb-1.5 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-zinc-500 shrink-0" /> Información de Ingreso
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4 space-y-2 min-w-0">
            <Label htmlFor="entry_date" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> Fecha de Ingreso
            </Label>
            <Input id="entry_date" type="date" {...register("entry_date")} className="w-full text-xs sm:text-sm" />
            {errors.entry_date && <p className="text-red-500 text-xs">{errors.entry_date.message}</p>}
          </div>

          {/* 1. Propietario / Cliente */}
          <div className="sm:col-span-8 space-y-2 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span>Propietario / Cliente</span>
              </Label>
              {selectedClientId && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 shrink-0">
                  <Check className="h-3 w-3" /> Seleccionado
                </span>
              )}
            </div>

            {selectedClient ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/90 shadow-2xs gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {selectedClient.name}
                      </p>
                      {clientVehicles.length > 0 ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-600 shrink-0">
                          {clientVehicles.length} {clientVehicles.length === 1 ? "vehículo" : "vehículos"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                          Sin vehículos
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5 flex-wrap">
                      {selectedClient.document && <span>CI/RUC: {selectedClient.document}</span>}
                      {selectedClient.document && selectedClient.phone && <span>•</span>}
                      {selectedClient.phone && <span>Tel: {selectedClient.phone}</span>}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearClient}
                  className="h-7 text-xs text-zinc-600 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-100 shrink-0 px-2.5"
                >
                  <X className="h-3 w-3 mr-1" /> Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative" ref={clientDropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={loadingClients ? "Cargando propietarios..." : "Buscar o seleccionar propietario..."}
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value)
                      setIsClientDropdownOpen(true)
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="pl-9 pr-8 text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                    tabIndex={-1}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isClientDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {isClientDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-zinc-100 text-sm">
                    {loadingClients ? (
                      <div className="p-3 text-center text-xs text-zinc-400">
                        Cargando propietarios...
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No se encontró ningún propietario que coincida.
                      </div>
                    ) : (
                      filteredClients.map((c) => {
                        const vehCount = vehicles.filter(
                          v => (v.client_id === c.id) || (v.client?.id === c.id)
                        ).length
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectClient(c.id)}
                            className="p-2.5 hover:bg-zinc-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-zinc-900 truncate">{c.name}</p>
                              <p className="text-xs text-zinc-400 truncate">
                                {c.document ? `CI/RUC: ${c.document}` : "Sin documento"}
                                {c.phone ? ` • Tel: ${c.phone}` : ""}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              {vehCount === 0 ? (
                                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  0 veh
                                </span>
                              ) : vehCount === 1 ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-medium px-1.5 py-0.5 rounded">
                                  1 vehículo
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 font-medium px-1.5 py-0.5 rounded">
                                  {vehCount} vehículos
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Vehículo a Reparar */}
          <div className="sm:col-span-8 space-y-2 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label htmlFor="vehicle_id" className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span>Vehículo a Reparar</span>
              </Label>
              {selectedClientId && clientVehicles.length > 0 && (
                <span className="text-[11px] text-zinc-500 text-right">
                  {clientVehicles.length === 1 
                    ? "Seleccionado automáticamente" 
                    : `${clientVehicles.length} vehículos del propietario`}
                </span>
              )}
            </div>

            {selectedClientId && clientVehicles.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-amber-900">Este propietario no tiene vehículos registrados</p>
                  <p className="text-amber-700">
                    Debes registrar un vehículo para este cliente antes de poder crear la orden de trabajo.
                  </p>
                </div>
              </div>
            ) : (
              <select
                id="vehicle_id"
                name={vehicleRegistration.name}
                ref={vehicleRegistration.ref}
                onBlur={vehicleRegistration.onBlur}
                onChange={handleVehicleChange}
                value={watch("vehicle_id") || ""}
                className="w-full max-w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring truncate"
              >
                {selectedClientId ? (
                  <>
                    {clientVehicles.length > 1 && (
                      <option value="">-- Seleccionar cuál de los vehículos reparar --</option>
                    )}
                    {clientVehicles.length === 0 && (
                      <option value="">-- Sin vehículos disponibles --</option>
                    )}
                    {clientVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        [{v.plate}] {v.brand} {v.model} {v.year ? `(${v.year})` : ""} {v.mileage ? `• ${v.mileage.toLocaleString()} km` : ""}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">-- Primero selecciona un propietario arriba --</option>
                    <optgroup label="O selecciona directamente de todos los vehículos:">
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          [{v.plate}] {v.brand} {v.model} {v.client?.name ? `- (${v.client.name})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            )}
            {errors.vehicle_id && <p className="text-red-500 text-xs">{errors.vehicle_id.message}</p>}
          </div>

          <div className="sm:col-span-4 space-y-2 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label htmlFor="vehicle_mileage" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Gauge className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
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
                className="font-mono text-xs pr-8 h-9 bg-white w-full"
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
          <div className="space-y-2 min-w-0">
            <Label htmlFor="mechanic_id" className="text-xs sm:text-sm">Mecánico Asignado</Label>
            <select
              id="mechanic_id"
              {...register("mechanic_id")}
              className="w-full max-w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring truncate"
            >
              <option value="">-- Sin asignar --</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.specialty || "Mecánico"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="priority" className="text-xs sm:text-sm">Prioridad de Trabajo</Label>
            <select
              id="priority"
              {...register("priority")}
              className="w-full max-w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Baja">🟢 Baja Prioridad</option>
              <option value="Media">🟡 Media Prioridad</option>
              <option value="Alta">🔴 Alta Prioridad</option>
            </select>
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="status" className="text-xs sm:text-sm">Estado del Trabajo</Label>
            <select
              id="status"
              {...register("status")}
              className="w-full max-w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        
        <div className="flex gap-2 min-w-0">
          <Input 
            placeholder="Pegar URL de la foto (ej: https://...)" 
            value={newPhotoInput} 
            onChange={(e) => setNewPhotoInput(e.target.value)}
            className="min-w-0 flex-1 text-xs sm:text-sm"
          />
          <Button type="button" variant="outline" onClick={addPhoto} className="shrink-0 text-xs sm:text-sm">
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
      <div className="space-y-4 pt-2 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500 shrink-0" /> Presupuesto Digital
          </h3>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-500 shrink-0">Estado Presupuesto:</span>
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
        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
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
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1.5 rounded-md text-[11px] animate-in fade-in gap-2 min-w-0">
              <div className="flex items-center gap-1.5 font-medium min-w-0 flex-1">
                <Package className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  Repuesto de inventario (Stock: <strong className="font-mono">{newItemStock ?? 0} un.</strong>). Se descontará.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewItemInventoryId(null)
                  setNewItemStock(null)
                }}
                className="text-[10px] text-blue-700 hover:text-blue-900 underline shrink-0 font-medium"
              >
                Desvincular
              </button>
            </div>
          )}

          {/* Accesos rápidos frecuentes */}
          {!newItemDesc && (
            <div className="flex items-center flex-wrap gap-1.5 pt-0.5 text-[11px] text-zinc-500">
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 transition-colors text-[10px]"
                >
                  <span>+ {quick.name}</span>
                  <span className="text-emerald-600 font-mono text-[9px]">₲ {quick.price / 1000}k</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-12 gap-2 min-w-0">
            <div className="col-span-4 sm:col-span-3 min-w-0">
              <label className="block text-[10px] text-zinc-500 mb-0.5 font-medium">Cantidad</label>
              <Input 
                type="number"
                placeholder="Cant." 
                value={newItemQty}
                min={1}
                onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                className="h-9 text-xs text-center bg-white w-full"
              />
            </div>
            <div className="col-span-5 sm:col-span-6 min-w-0">
              <label className="block text-[10px] text-zinc-500 mb-0.5 font-medium truncate">Precio Unitario (₲)</label>
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
                className="h-9 text-xs bg-white font-mono w-full"
              />
            </div>
            <div className="col-span-3 min-w-0 flex items-end">
              <Button type="button" size="sm" onClick={() => addBudgetItem()} className="w-full h-9 bg-zinc-900 text-white text-xs px-1.5 sm:px-3 font-medium">
                <Plus className="h-3.5 w-3.5 mr-0.5 sm:mr-1 shrink-0" />
                <span>Ítem</span>
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
                <div key={idx} className="bg-white border border-zinc-200 rounded-lg p-2.5 space-y-1.5 shadow-xs min-w-0">
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <span className="font-semibold text-zinc-900 text-xs leading-snug break-words">{item.description}</span>
                      {item.inventory_id && (
                        <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded inline-flex items-center gap-0.5 shrink-0">
                          <Package className="h-2.5 w-2.5" /> Stock
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBudgetItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1 -mr-1 -mt-1 shrink-0"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-100 flex-wrap gap-1">
                    <span className="truncate">Cant: <strong className="text-zinc-700">{item.quantity}</strong> × {formatCurrency(item.price)}</span>
                    <span className="font-bold text-zinc-900 font-mono text-xs shrink-0">{formatCurrency(item.total)}</span>
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
