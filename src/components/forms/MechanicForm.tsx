"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createMechanic, updateMechanic, MechanicData } from "@/actions/mechanics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

const mechanicSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  specialty: z.string().min(2, "Especialidad requerida"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  status: z.enum(["Activo", "Inactivo"]),
})

type MechanicFormValues = z.infer<typeof mechanicSchema>

interface MechanicFormProps {
  initialData?: MechanicData
  onSuccess?: () => void
}

export function MechanicForm({ initialData, onSuccess }: MechanicFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData?.id

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: {
      name: initialData?.name || "",
      specialty: initialData?.specialty || "Mecánica General",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      status: initialData?.status || "Activo",
    }
  })

  const onSubmit = async (data: MechanicFormValues) => {
    try {
      setError(null)
      if (isEditing && initialData?.id) {
        await updateMechanic(initialData.id, data)
      } else {
        await createMechanic(data)
      }
      if (onSuccess) onSuccess()
      else router.refresh()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    } catch (err: any) {
      setError(err.message || "Error al guardar perfil de mecánico")
    }
  }

  const specialtiesOptions = [
    "Mecánica General",
    "Motor & Transmisión",
    "Electricidad & Electrónica",
    "Frenos & Suspensión",
    "Inyección Electrónica",
    "Aire Acondicionado",
    "Diagnóstico por Escáner"
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo del Mecánico</Label>
        <Input id="name" {...register("name")} placeholder="Carlos Benítez" />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty">Especialidad Principal</Label>
          <select 
            id="specialty" 
            {...register("specialty")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {specialtiesOptions.map((spec, i) => (
              <option key={i} value={spec}>{spec}</option>
            ))}
          </select>
          {errors.specialty && <p className="text-red-500 text-xs">{errors.specialty.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select 
            id="status" 
            {...register("status")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="Activo">🟢 Activo</option>
            <option value="Inactivo">🔴 Inactivo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono / WhatsApp</Label>
          <Input id="phone" {...register("phone")} placeholder="0981 555 123" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
          <Input id="email" type="email" {...register("email")} placeholder="carlos@taller.com" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Perfil de Mecánico" : "Crear Perfil de Mecánico"}
        </Button>
      </div>
    </form>
  )
}
