"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleForm } from "@/components/forms/VehicleForm"
import { deleteVehicle } from "@/actions/vehicles"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"

interface Vehicle {
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

export function EditVehicleModal({ vehicle, clientId }: { vehicle: Vehicle; clientId?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900" />}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Vehículo ({vehicle.plate})</DialogTitle>
        </DialogHeader>
        <VehicleForm clientId={clientId || vehicle.client_id} initialData={vehicle} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteVehicleButton({ vehicleId, plate, clientId }: { vehicleId: string; plate: string; clientId?: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteVehicle(vehicleId, clientId)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al eliminar el vehículo")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" />}>
        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">¿Eliminar Vehículo?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-zinc-600">
          ¿Estás seguro de que deseas eliminar el vehículo con chapa <strong className="text-zinc-900 font-mono">{plate}</strong>?
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddVehicleModal({ clientId, clientName, buttonVariant = "default", buttonText = "Agregar Vehículo" }: { clientId?: string; clientName?: string; buttonVariant?: "default" | "outline" | "ghost"; buttonText?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button 
            size="sm" 
            variant={buttonVariant}
            className={buttonVariant === "default" ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" : ""}
          />
        }
      >
        <Plus className="mr-1 h-4 w-4" /> {buttonText}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Vehículo {clientName ? `para ${clientName}` : ""}</DialogTitle>
        </DialogHeader>
        <VehicleForm clientId={clientId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
