"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InventoryForm } from "@/components/forms/InventoryForm"
import { deleteInventoryItem, adjustInventoryStock, InventoryItemData } from "@/actions/inventory"
import { Edit, Trash2, PackagePlus, Loader2, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"

export function EditInventoryModal({ item }: { item: InventoryItemData }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900" />}>
        <Edit className="h-4 w-4 mr-1" /> Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Editar Repuesto ({item.code})</DialogTitle>
        </DialogHeader>
        <InventoryForm initialData={item} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteInventoryButton({ itemId, name }: { itemId: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteInventoryItem(itemId)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al eliminar el repuesto")
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
          <DialogTitle className="text-red-600">¿Eliminar Repuesto?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-zinc-600">
          ¿Estás seguro de que deseas eliminar <strong className="text-zinc-900">{name}</strong> del inventario?
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

export function AdjustStockModal({ itemId, name, currentStock }: { itemId: string; name: string; currentStock: number }) {
  const [open, setOpen] = useState(false)
  const [stockVal, setStockVal] = useState(currentStock)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      await adjustInventoryStock(itemId, stockVal)
      setOpen(false)
    } catch (err: any) {
      alert(err.message || "Error al actualizar stock")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="border-zinc-300 text-zinc-800 hover:bg-zinc-100" />}>
        <PackagePlus className="mr-1.5 h-3.5 w-3.5 text-zinc-600" /> Ajustar Stock
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ajustar Stock de Repuesto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-zinc-600 font-semibold">{name}</p>

          <div className="flex items-center justify-center space-x-4 py-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => setStockVal(Math.max(0, stockVal - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="text-center w-24">
              <Input 
                type="number" 
                value={stockVal} 
                onChange={(e) => setStockVal(parseInt(e.target.value) || 0)}
                className="text-center text-lg font-bold font-mono"
              />
              <span className="text-[10px] text-zinc-400 block mt-1">Stock Actual</span>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => setStockVal(stockVal + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-zinc-900 text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Stock"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
