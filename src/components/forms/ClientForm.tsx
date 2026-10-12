"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient, updateClient } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

const clientSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  document: z.string().min(3, "Documento requerido"),
  phone: z.string().min(5, "Teléfono requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  initialData?: {
    id: string
    name: string
    document: string
    phone: string
    email?: string | null
    address?: string | null
  }
  onSuccess?: () => void
}

export function ClientForm({ initialData, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || "",
      document: initialData?.document || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
    }
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      setError(null);
      if (isEditing) {
        await updateClient(initialData.id, data);
      } else {
        await createClient(data);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } catch (err: any) {
      setError(err.message || "Error al procesar el cliente");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre / Razón Social</Label>
          <Input id="name" {...register("name")} placeholder="Juan Pérez" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">Documento / RUC</Label>
          <Input id="document" {...register("document")} placeholder="1234567-8" />
          {errors.document && <p className="text-red-500 text-xs">{errors.document.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register("phone")} placeholder="0981 123 456" />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (Opcional)</Label>
          <Input id="email" type="email" {...register("email")} placeholder="juan@ejemplo.com" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección (Opcional)</Label>
        <Input id="address" {...register("address")} placeholder="Av. Principal 123" />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Cliente" : "Guardar Cliente"}
        </Button>
      </div>
    </form>
  );
}
