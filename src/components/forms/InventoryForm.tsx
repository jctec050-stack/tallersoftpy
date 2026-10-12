"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createInventoryItem, updateInventoryItem, InventoryItemData } from "@/actions/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

const inventorySchema = z.object({
  code: z.string().min(2, "Código o SKU requerido").toUpperCase(),
  name: z.string().min(2, "Nombre de repuesto requerido"),
  category: z.string().min(1, "Categoría requerida"),
  brand: z.string().optional(),
  stock: z.coerce.number().min(0, "Stock no puede ser negativo"),
  min_stock: z.coerce.number().min(0, "Stock mínimo no puede ser negativo"),
  cost_price: z.coerce.number().min(0, "Precio de costo no puede ser negativo"),
  sale_price: z.coerce.number().min(0, "Precio de venta no puede ser negativo"),
  location: z.string().optional(),
})

type InventoryFormValues = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  initialData?: InventoryItemData
  onSuccess?: () => void
}

export function InventoryForm({ initialData, onSuccess }: InventoryFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData?.id

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof inventorySchema>, any, InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      category: initialData?.category || "Mantenimiento & Aceites",
      brand: initialData?.brand || "",
      stock: initialData?.stock || 0,
      min_stock: initialData?.min_stock || 3,
      cost_price: initialData?.cost_price || 0,
      sale_price: initialData?.sale_price || 0,
      location: initialData?.location || "",
    }
  })

  const onSubmit = async (data: InventoryFormValues) => {
    try {
      setError(null)
      if (isEditing && initialData?.id) {
        await updateInventoryItem(initialData.id, data)
      } else {
        await createInventoryItem(data)
      }
      if (onSuccess) onSuccess()
      else router.refresh()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    } catch (err: any) {
      setError(err.message || "Error al guardar producto en inventario")
    }
  }

  const categoryOptions = [
    "Mantenimiento & Aceites",
    "Sistema de Frenos",
    "Motor & Inyección",
    "Suspensión & Dirección",
    "Electricidad & Encendido",
    "Neumáticos & Llantas",
    "Transmisión & Embrague",
    "Aire Acondicionado",
    "Accesorios & Varios"
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código / SKU Repuesto</Label>
          <Input id="code" {...register("code")} placeholder="ACE-5W30" className="uppercase font-mono" />
          {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <select 
            id="category" 
            {...register("category")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categoryOptions.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Descripción / Repuesto</Label>
          <Input id="name" {...register("name")} placeholder="Filtro de Aceite Toyota Hilux" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca / Fabricante</Label>
          <Input id="brand" {...register("brand")} placeholder="Bosch, Castrol, Genuine..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Actual (Cantidad)</Label>
          <Input id="stock" type="number" {...register("stock")} placeholder="10" />
          {errors.stock && <p className="text-red-500 text-xs">{errors.stock.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_stock">Stock Mínimo (Alerta Reposición)</Label>
          <Input id="min_stock" type="number" {...register("min_stock")} placeholder="3" />
          {errors.min_stock && <p className="text-red-500 text-xs">{errors.min_stock.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost_price">Precio de Costo (₲)</Label>
          <Input id="cost_price" type="number" {...register("cost_price")} placeholder="35000" />
          {errors.cost_price && <p className="text-red-500 text-xs">{errors.cost_price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale_price">Precio de Venta al Público (₲)</Label>
          <Input id="sale_price" type="number" {...register("sale_price")} placeholder="60000" />
          {errors.sale_price && <p className="text-red-500 text-xs">{errors.sale_price.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación en Depósito (Opcional)</Label>
        <Input id="location" {...register("location")} placeholder="Estante A-2, Depósito Principal" />
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Repuesto" : "Registrar Repuesto"}
        </Button>
      </div>
    </form>
  )
}
