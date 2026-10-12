"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MechanicForm } from "@/components/forms/MechanicForm"
import { deleteMechanic, assignRepairToMechanic, MechanicData } from "@/actions/mechanics"
import { getRepairs } from "@/actions/repairs"
import { Edit, Trash2, Wrench, Loader2, Plus, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function EditMechanicModal({ mechanic }: { mechanic: MechanicData }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900" />}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Mecánico</DialogTitle>
        </DialogHeader>
        <MechanicForm initialData={mechanic} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteMechanicButton({ mechanicId, name }: { mechanicId: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteMechanic(mechanicId)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al eliminar el mecánico")
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
          <DialogTitle className="text-red-600">¿Eliminar Mecánico?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-zinc-600">
          ¿Estás seguro de que deseas eliminar el perfil de <strong className="text-zinc-900">{name}</strong>?
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

export function AssignServiceModal({ mechanicId, mechanicName }: { mechanicId: string; mechanicName: string }) {
  const [open, setOpen] = useState(false)
  const [repairs, setRepairs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      getRepairs().then(res => {
        setRepairs(res.repairs || [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [open])

  const handleAssign = async (repairId: string) => {
    try {
      setAssigningId(repairId)
      await assignRepairToMechanic(repairId, mechanicId)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al asignar la orden de trabajo")
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="border-zinc-300 text-zinc-800 hover:bg-zinc-100" />}>
        <Wrench className="mr-1.5 h-3.5 w-3.5 text-zinc-600" /> Asignar Servicio
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-zinc-700" /> Asignar Trabajo a {mechanicName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-xs text-zinc-500">Selecciona una orden de reparación para asignársela a este mecánico:</p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-zinc-500 gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando órdenes de reparación...
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg text-zinc-500 text-xs">
              No hay órdenes de reparación disponibles para asignar.
            </div>
          ) : (
            <div className="space-y-2">
              {repairs.map((r) => {
                const isAssignedToThis = r.mechanic_id === mechanicId
                const vehicle = r.vehicle

                return (
                  <div key={r.id} className="p-3 border rounded-lg bg-white flex justify-between items-center hover:bg-zinc-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {vehicle && (
                          <Badge variant="outline" className="font-mono text-[10px] bg-zinc-100 uppercase font-bold">
                            {vehicle.plate}
                          </Badge>
                        )}
                        <span className="font-semibold text-xs text-zinc-900">{r.reason}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Estado: <span className="font-medium text-zinc-700">{r.status}</span> | Prioridad: <span className="font-medium text-zinc-700">{r.priority}</span>
                      </div>
                    </div>

                    <div>
                      {isAssignedToThis ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <Check className="h-3 w-3 mr-1" /> Ya Asignado
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-8"
                          onClick={() => handleAssign(r.id)}
                          disabled={assigningId === r.id}
                        >
                          {assigningId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Asignar"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
