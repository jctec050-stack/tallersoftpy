"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { getAppBaseUrl } from "@/lib/utils"
import { FileText, Printer, Share2, FileDown, Loader2 } from "lucide-react"

export interface BudgetItem {
  id?: string
  description: string
  quantity: number
  price: number
  total: number
}

export interface RepairDetail {
  id: string
  entry_date?: string
  reason: string
  diagnosis?: string
  priority?: string
  status: string
  budget_items?: BudgetItem[]
  budget_total?: number
  budget_status?: string
  vehicle?: {
    plate: string
    brand: string
    model: string
    year?: number
    mileage?: number
    client?: {
      name: string
      document?: string
      phone?: string
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

  const [loadingPdf, setLoadingPdf] = useState(false)

  // Generar texto para compartir por WhatsApp
  const generateWhatsAppBudgetText = () => {
    if (!client) return ""
    const pdfPublicUrl = `${getAppBaseUrl()}/api/repairs/${repair.id}/pdf`

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
    if (pdfPublicUrl) {
      text += `📄 *PDF Digital:* Puede ver y descargar el documento oficial aquí:\n${pdfPublicUrl}\n\n`
    }
    text += `Quedamos a su disposición para cualquier duda. ¡Gracias por elegir Taller San Luis!`
    
    return generateWhatsAppLink(client.phone || "", text)
  }

  const handleSendWhatsApp = async () => {
    if (!client) return
    setLoadingPdf(true)

    try {
      const pdfEndpoint = `/api/repairs/${repair.id}/pdf`
      const res = await fetch(pdfEndpoint)
      if (!res.ok) throw new Error("Error al obtener PDF")
      const blob = await res.blob()
      const fileName = `Presupuesto-PRES-${repair.id.slice(0, 8)}.pdf`
      const pdfFile = new File([blob], fileName, { type: "application/pdf" })

      // 1. Si el navegador soporta compartir archivos directamente (móviles / Web Share API)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Presupuesto #${repair.id.slice(0, 8)} - Taller San Luis`,
            text: `Hola ${client.name}, le adjuntamos el presupuesto de su vehículo ${vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : ""}.\nTotal: ${formatCurrency(total)}\n\nTaller Mecánico San Luis.`
          })
          setLoadingPdf(false)
          return
        } catch (shareErr: unknown) {
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            setLoadingPdf(false)
            return
          }
          console.warn("Share API fallback:", shareErr)
        }
      }

      // 2. Escritorio / Fallback: Descarga directa del PDF al equipo
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Y abrir WhatsApp con los datos y enlace al PDF
      const whatsappUrl = generateWhatsAppBudgetText()
      window.open(whatsappUrl, "_blank")
    } catch (err) {
      console.error("Error al procesar PDF para WhatsApp:", err)
      window.open(generateWhatsAppBudgetText(), "_blank")
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="w-full sm:w-auto bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs h-9 justify-center" />}>
        <FileText className="mr-1.5 h-4 w-4 text-emerald-600 shrink-0" /> Presupuesto Digital
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[720px] max-h-[92vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-zinc-900">
              <FileText className="h-5 w-5 text-emerald-600 shrink-0" /> Presupuesto Digital
            </DialogTitle>
            <Badge variant="outline" className="font-semibold text-xs bg-zinc-100 shrink-0">
              {repair.budget_status || "Borrador"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Layout imprimible del Presupuesto */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-6 space-y-4 sm:space-y-6 text-zinc-900 shadow-xs">
          {/* Header Empresa */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-10 sm:h-14 sm:w-12 shrink-0 flex items-center justify-center">
                <Image
                  src="/logotaller.webp"
                  alt="Logo Taller San Luis"
                  width={48}
                  height={60}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="text-zinc-900 font-bold text-sm sm:text-lg uppercase tracking-wider leading-tight">
                  TALLER MECÁNICO SAN LUIS
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-tight">
                  Servicio Automotriz Multimarca & Mantenimiento
                </p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                  Hernandarias - Paraguay · Tel: 0975 882 828
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end bg-zinc-50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-zinc-100 text-left sm:text-right">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest block">
                  ORDEN DE TRABAJO
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
                  #PRES-{repair.id.slice(0, 8)}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-500 block sm:mt-1">
                Fecha: {repair.entry_date ? new Date(repair.entry_date).toLocaleDateString("es-PY") : "S/F"}
              </span>
            </div>
          </div>

          {/* Datos Cliente y Vehículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-zinc-50 p-3 sm:p-4 rounded-lg border border-zinc-100 text-xs sm:text-sm">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">DATOS DEL CLIENTE</p>
              <p className="font-bold text-zinc-900 text-sm sm:text-base">{client?.name || "Cliente General"}</p>
              <p className="text-zinc-600 text-xs">RUC/CI: <span className="font-medium text-zinc-800">{client?.document || "S/D"}</span></p>
              <p className="text-zinc-600 text-xs">Teléfono: <span className="font-medium text-zinc-800">{client?.phone || "S/T"}</span></p>
            </div>
            <div className="space-y-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">DATOS DEL VEHÍCULO</p>
              {vehicle ? (
                <>
                  <p className="font-bold text-zinc-900 text-sm sm:text-base">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                  <p className="text-zinc-600 text-xs font-mono">Chapa: <span className="font-bold text-zinc-800 bg-zinc-200/60 px-1.5 py-0.5 rounded text-[11px]">{vehicle.plate}</span></p>
                  <p className="text-zinc-600 text-xs">Kilometraje: <span className="font-medium text-zinc-800">{vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km</span></p>
                </>
              ) : (
                <p className="text-zinc-500 italic text-xs">Sin vehículo asignado</p>
              )}
            </div>
          </div>

          {/* Motivo y Diagnóstico */}
          <div className="space-y-1.5 text-xs sm:text-sm border-l-2 border-zinc-900 pl-3 py-0.5">
            <p><strong className="text-zinc-900">Motivo de Ingreso:</strong> <span className="text-zinc-700">{repair.reason}</span></p>
            {repair.diagnosis && (
              <p><strong className="text-zinc-900">Diagnóstico Técnico:</strong> <span className="text-zinc-700">{repair.diagnosis}</span></p>
            )}
          </div>

          {/* Tabla y Lista de Repuestos y Mano de Obra */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Detalle de Repuestos y Servicios
              </p>
              <span className="text-xs text-zinc-400 font-medium">
                {items.length} {items.length === 1 ? "ítem" : "ítems"}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 italic text-xs border border-dashed border-zinc-200 rounded-lg">
                No hay repuestos o servicios cargados en este presupuesto.
              </div>
            ) : (
              <>
                {/* 1. Vista Móvil (Cards) - Sin scroll horizontal */}
                <div className="block sm:hidden space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="bg-zinc-50/90 border border-zinc-200 rounded-lg p-2.5 space-y-1.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-zinc-900 text-xs leading-snug break-words">
                          {item.description}
                        </span>
                        <span className="font-bold text-zinc-900 font-mono text-xs shrink-0 whitespace-nowrap">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60 flex-wrap gap-1">
                        <span>Cant: <strong className="text-zinc-700 font-mono">{item.quantity}</strong></span>
                        <span>P. Unit: <strong className="text-zinc-700 font-mono">{formatCurrency(item.price)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Vista Desktop (Tabla Tradicional) */}
                <div className="hidden sm:block overflow-hidden rounded-lg border border-zinc-200">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-zinc-100 text-zinc-700 text-xs uppercase font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {items.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-zinc-900">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-zinc-600 font-mono">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-600 font-mono">{formatCurrency(item.price)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-zinc-900 font-mono">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Banner de Total (Visible en móvil y desktop) */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 bg-zinc-900 text-white rounded-lg p-3 sm:p-4 shadow-xs">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
                    Total del Presupuesto:
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-emerald-400 whitespace-nowrap">
                    {formatCurrency(total)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notas finales */}
          <div className="text-[11px] text-zinc-400 text-center border-t border-zinc-100 pt-2.5">
            Presupuesto válido por 7 días hábiles. Sujeto a variaciones por fallas ocultas en desarme.
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pt-2">
          {client?.phone ? (
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={loadingPdf}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs text-xs sm:text-sm h-10"
            >
              {loadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando PDF...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                </>
              )}
            </Button>
          ) : (
            <div className="text-xs text-amber-600 py-1">
              * El cliente no tiene teléfono registrado para WhatsApp
            </div>
          )}

          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
            <a
              href={`/api/repairs/${repair.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md text-xs font-medium transition-colors shadow-xs h-9"
              title="Abrir o descargar PDF oficial"
            >
              <FileDown className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="truncate">PDF</span>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-9 justify-center"
            >
              <Printer className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span>Imprimir</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs h-9 justify-center"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
