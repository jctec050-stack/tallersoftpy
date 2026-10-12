"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RepairForm } from "@/components/forms/RepairForm"
import { deleteRepair, RepairData } from "@/actions/repairs"
import { Edit, Trash2, Loader2 } from "lucide-react"

export function EditRepairModal({ repair }: { repair: RepairData }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900" />}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden de Reparación</DialogTitle>
        </DialogHeader>
        <RepairForm initialData={repair} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteRepairButton({ repairId, reason }: { repairId: string; reason: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteRepair(repairId)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al eliminar la orden de reparación")
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
          <DialogTitle className="text-red-600">¿Eliminar Orden de Reparación?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-zinc-600">
          ¿Estás seguro de que deseas eliminar la orden de reparación para "<strong className="text-zinc-900">{reason}</strong>"?
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
