"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createVehicle, updateVehicle } from "@/actions/vehicles"
import { getClients } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const vehicleSchema = z.object({
  client_id: z.string().min(1, "Debes seleccionar un cliente"),
  plate: z.string().min(3, "Chapa requerida").toUpperCase(),
  brand: z.string().min(2, "Marca requerida"),
  model: z.string().min(1, "Modelo requerido"),
  year: z.coerce.number().min(1900, "Año inválido").max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().min(0, "El kilometraje no puede ser negativo"),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

interface ClientOption {
  id: string
  name: string
  document?: string
}

interface VehicleFormProps {
  clientId?: string
  clients?: ClientOption[]
  initialData?: {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    mileage: number
    vin?: string | null
    color?: string | null
    client_id?: string
  }
  onSuccess?: () => void
}

export function VehicleForm({ clientId, clients: initialClients, initialData, onSuccess }: VehicleFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [clientList, setClientList] = useState<ClientOption[]>(initialClients || []);
  const [loadingClients, setLoadingClients] = useState<boolean>(!initialClients || initialClients.length === 0);

  const isEditing = !!initialData?.id;
  const targetClientId = clientId || initialData?.client_id || "";

  useEffect(() => {
    if (!initialClients || initialClients.length === 0) {
      setLoadingClients(true);
      getClients().then(res => {
        if (res.clients) {
          setClientList(res.clients);
        }
        setLoadingClients(false);
      }).catch(() => setLoadingClients(false));
    }
  }, [initialClients]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof vehicleSchema>, any, VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      client_id: targetClientId,
      plate: initialData?.plate || "",
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || new Date().getFullYear(),
      mileage: initialData?.mileage || 0,
      vin: initialData?.vin || "",
      color: initialData?.color || "",
    }
  });

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      setError(null);
      if (isEditing) {
        await updateVehicle(initialData.id, data, data.client_id);
      } else {
        await createVehicle(data);
      }
      if (onSuccess) onSuccess();
      else router.refresh();
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } catch (err: any) {
      setError(err.message || "Error al procesar el vehículo");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      {/* Selector de Cliente */}
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente Propietario</Label>
        <select 
          id="client_id"
          {...register("client_id")} 
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-75"
          disabled={!!clientId && !isEditing}
        >
          <option value="">{loadingClients ? "Cargando clientes..." : "-- Seleccionar Cliente --"}</option>
          {clientList.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} {c.document ? `(${c.document})` : ""}
            </option>
          ))}
        </select>
        {errors.client_id && <p className="text-red-500 text-xs">{errors.client_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plate">Chapa / Matrícula</Label>
          <Input id="plate" {...register("plate")} placeholder="AAA 123" className="uppercase" />
          {errors.plate && <p className="text-red-500 text-xs">{errors.plate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Kilometraje (km)</Label>
          <Input id="mileage" type="number" {...register("mileage")} placeholder="15000" />
          {errors.mileage && <p className="text-red-500 text-xs">{errors.mileage.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} placeholder="Toyota" />
          {errors.brand && <p className="text-red-500 text-xs">{errors.brand.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" {...register("model")} placeholder="Hilux" />
          {errors.model && <p className="text-red-500 text-xs">{errors.model.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <Input id="year" type="number" {...register("year")} placeholder="2020" />
          {errors.year && <p className="text-red-500 text-xs">{errors.year.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color (Opcional)</Label>
          <Input id="color" {...register("color")} placeholder="Blanco" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vin">VIN / Chasis (Opcional)</Label>
        <Input id="vin" {...register("vin")} placeholder="JTDK..." />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Vehículo" : "Guardar Vehículo"}
        </Button>
      </div>
    </form>
  );
}
