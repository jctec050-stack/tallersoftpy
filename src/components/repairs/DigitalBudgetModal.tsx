"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { FileText, Printer, Share2, Wrench, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react"

interface BudgetItem {
  id?: string
  description: string
  quantity: number
  price: number
  total: number
}

interface RepairDetail {
  id: string
  entry_date: string
  reason: string
  diagnosis?: string
  priority: string
  status: string
  budget_items?: BudgetItem[]
  budget_total?: number
  budget_status?: string
  vehicle?: {
    plate: string
    brand: string
    model: string
    year: number
    mileage: number
    client?: {
      name: string
      document: string
      phone: string
      email?: string
      address?: string
    }
  }
}

export function DigitalBudgetModal({ repair }: { repair: RepairDetail }) {
  const [open, setOpen] = useState(false)

  const items = repair.budget_items || []
  const total = repair.budget_total || items.reduce((sum, item) => sum + (item.total || 0), 0)
  const client = repair.vehicle?.client
  const vehicle = repair.vehicle

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  // Generar texto para compartir por WhatsApp
  const generateWhatsAppBudgetText = () => {
    if (!client) return ""
    let text = `*PRESUPUESTO DIGITAL - TALLER SAN LUIS*\n`
    text += `-----------------------------------\n`
    text += `👤 *Cliente:* ${client.name}\n`
    if (vehicle) text += `🚗 *Vehículo:* ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\n`
    text += `📋 *Motivo:* ${repair.reason}\n`
    text += `-----------------------------------\n`
    text += `*DETALLE DEL PRESUPUESTO:*\n`
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.description} (${item.quantity}x) - ${formatCurrency(item.total)}\n`
    })
    text += `-----------------------------------\n`
    text += `💰 *TOTAL GENERAL: ${formatCurrency(total)}*\n\n`
    text += `Quedamos a su disposición para cualquier duda. ¡Gracias por elegir Taller San Luis!`
    
    return generateWhatsAppLink(client.phone, text)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" />}>
        <FileText className="mr-1.5 h-4 w-4 text-emerald-600" /> Presupuesto Digital
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-6">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-700" /> Presupuesto Digital
            </span>
            <Badge variant="outline" className="font-medium bg-zinc-100">
              Estado: {repair.budget_status || "Borrador"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Layout imprimible del Presupuesto */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 text-zinc-900 shadow-xs">
          {/* Header Empresa */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xl uppercase tracking-wider">
                <Wrench className="h-6 w-6 text-zinc-800" /> TALLER SAN LUIS
              </div>
              <p className="text-xs text-zinc-500 mt-1">Servicio Automotriz Multimarca & Mantenimiento</p>
              <p className="text-xs text-zinc-500">Asunción - Paraguay | Tel: 0981 123 456</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block">ORDEN DE TRABAJO</span>
              <span className="font-mono text-sm font-bold text-zinc-900">#PRES-{repair.id.slice(0, 8)}</span>
              <span className="text-xs text-zinc-500 block mt-1">Fecha: {new Date(repair.entry_date).toLocaleDateString("es-PY")}</span>
            </div>
          </div>

          {/* Datos Cliente y Vehículo */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100 text-sm">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">DATOS DEL CLIENTE</p>
              <p className="font-bold text-zinc-900">{client?.name || "Cliente General"}</p>
              <p className="text-zinc-600 text-xs">RUC/CI: {client?.document || "S/D"}</p>
              <p className="text-zinc-600 text-xs">Teléfono: {client?.phone || "S/T"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">DATOS DEL VEHÍCULO</p>
              {vehicle ? (
                <>
                  <p className="font-bold text-zinc-900">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                  <p className="text-zinc-600 text-xs font-mono">Chapa: {vehicle.plate}</p>
                  <p className="text-zinc-600 text-xs">Kilometraje: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km</p>
                </>
              ) : (
                <p className="text-zinc-500 italic text-xs">Sin vehículo asignado</p>
              )}
            </div>
          </div>

          {/* Motivo y Diagnóstico */}
          <div className="space-y-2 text-sm border-l-2 border-zinc-900 pl-3">
            <p><strong className="text-zinc-900">Motivo de Ingreso:</strong> {repair.reason}</p>
            {repair.diagnosis && <p><strong className="text-zinc-900">Diagnóstico Técnico:</strong> {repair.diagnosis}</p>}
          </div>

          {/* Tabla de Repuestos y Mano de Obra */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detalle de Repuestos y Servicios</p>
            <table className="w-full text-sm text-left border border-zinc-200 rounded-lg overflow-hidden">
              <thead className="bg-zinc-100 text-zinc-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400 italic text-xs">
                      No hay repuestos o servicios cargados en este presupuesto.
                    </td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-3 font-medium text-zinc-900">{item.description}</td>
                      <td className="py-2.5 px-3 text-center text-zinc-600">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-zinc-600">{formatCurrency(item.price)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-zinc-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-zinc-900 text-white font-bold text-sm">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-xs">Total del Presupuesto:</td>
                  <td className="py-3 px-4 text-right text-base text-emerald-400">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notas finales */}
          <div className="text-[11px] text-zinc-400 text-center border-t border-zinc-100 pt-3">
            Presupuesto válido por 7 días hábiles. Sujeto a variaciones por fallas ocultas en desarme.
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-2">
          {client?.phone ? (
            <a 
              href={generateWhatsAppBudgetText()} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-xs"
            >
              <Share2 className="h-4 w-4" /> Enviar por WhatsApp
            </a>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
