"use client"

import React, { useState } from "react"
import { InvoiceData } from "@/actions/invoices"
import { WORKSHOP_CONFIG } from "@/lib/company-config"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { getAppBaseUrl } from "@/lib/utils"
import { numberToWordsGuaranies } from "@/lib/invoice-utils"
import { FileText, Printer, Share2, FileDown, Loader2, CheckCircle2, Car, Receipt } from "lucide-react"

interface DigitalInvoiceModalProps {
  invoice: InvoiceData
  trigger?: React.ReactNode
}

export function DigitalInvoiceModal({ invoice, trigger }: DigitalInvoiceModalProps) {
  const [open, setOpen] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const client = invoice.client || { name: "Cliente General" }
  const repairs = invoice.repairs_summary || []
  const total = invoice.total || 0
  const amountWords = numberToWordsGuaranies(total)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Descargar PDF oficial
  const handleDownloadPdf = async () => {
    setLoadingPdf(true)
    try {
      let res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) {
        // Si no está en BD, usar POST con el payload completo
        res = await fetch(`/api/invoices/${invoice.id}/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoice),
        })
      }

      if (!res.ok) throw new Error("No se pudo generar el PDF de la factura.")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Factura-${invoice.invoice_number.replace(/\s+/g, "_")}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error al descargar PDF:", err)
      alert("Error al descargar el PDF de la factura.")
    } finally {
      setLoadingPdf(false)
    }
  }

  // Abrir para Imprimir
  const handlePrint = async () => {
    setLoadingPdf(true)
    try {
      let res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) {
        res = await fetch(`/api/invoices/${invoice.id}/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoice),
        })
      }

      if (!res.ok) throw new Error("Error al obtener PDF para imprimir.")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.focus()
      }
    } catch (err) {
      console.error("Error al imprimir:", err)
      window.print()
    } finally {
      setLoadingPdf(false)
    }
  }

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    const pdfPublicUrl = `${getAppBaseUrl()}/api/invoices/${invoice.id}/pdf`
    let text = `*COMPROBANTE DE FACTURA - ${WORKSHOP_CONFIG.name}*\n`
    text += `-----------------------------------\n`
    text += `🧾 *Factura N°:* ${invoice.invoice_number}\n`
    text += `📅 *Fecha:* ${invoice.date || new Date().toISOString().split("T")[0]}\n`
    text += `💳 *Condición:* ${invoice.condition}\n`
    text += `👤 *Cliente:* ${client.name}\n`
    if (client.document) text += `🆔 *RUC / C.I.:* ${client.document}\n`
    text += `-----------------------------------\n`
    text += `*RESUMEN DE TRABAJOS FACTURADOS (${repairs.length}):*\n`

    repairs.forEach((r, idx) => {
      const v = r.vehicle
      const vText = v ? `${v.brand} ${v.model} [${v.plate}]` : "Vehículo"
      text += `\n${idx + 1}. *${vText}*\n`
      text += `   Trabajo: ${r.reason}\n`
      text += `   Monto: ${formatCurrency(r.budget_total)}\n`
    })

    text += `-----------------------------------\n`
    text += `💰 *TOTAL FACTURADO: ${formatCurrency(total)}*\n`
    text += `*(${amountWords})*\n\n`
    text += `📄 *PDF de Factura Oficial:*\n${pdfPublicUrl}\n\n`
    text += `¡Muchas gracias por su preferencia!`

    const link = generateWhatsAppLink(client.phone || "", text)
    window.open(link, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger ? (
          trigger as any
        ) : (
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Receipt className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Ver Factura
          </Button>
        )
      } />

      <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-zinc-50/50">
        <DialogHeader className="pb-3 border-b border-zinc-200 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-zinc-900">
              <Receipt className="h-5 w-5 text-emerald-600" /> Factura Digital Oficial
            </DialogTitle>
            <p className="text-xs text-zinc-500">
              Comprobante fiscal con todos los presupuestos y trabajos agrupados.
            </p>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-mono font-bold">
              {invoice.invoice_number}
            </Badge>
          </div>
        </DialogHeader>

        {/* Acciones Rápidas Superior */}
        <div className="flex flex-wrap gap-2 pt-2 pb-3">
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-xs"
          >
            {loadingPdf ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1.5" />}
            Descargar PDF Oficial
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            disabled={loadingPdf}
            className="text-xs h-8 bg-white border-zinc-300 hover:bg-zinc-100"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-zinc-600" /> Imprimir
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleShareWhatsApp}
            className="text-xs h-8 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> WhatsApp
          </Button>
        </div>

        {/* FACTURA FÍSICA SIMULADA */}
        <div className="bg-white border-2 border-zinc-900 rounded-lg p-4 sm:p-6 shadow-sm space-y-4 font-sans text-xs">
          {/* 1. Header Emisor y Timbrado */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 border-b-2 border-zinc-900 pb-4">
            <div className="sm:col-span-7 space-y-1">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">{WORKSHOP_CONFIG.name}</h2>
              <p className="text-[10px] font-bold text-zinc-700 uppercase">
                {WORKSHOP_CONFIG.activity}
              </p>
              <p className="text-[11px] text-zinc-600">{WORKSHOP_CONFIG.address}</p>
              <p className="text-[11px] text-zinc-600">Tel / WhatsApp: {WORKSHOP_CONFIG.phone}</p>
            </div>

            <div className="sm:col-span-5 border-2 border-zinc-900 rounded p-2.5 text-center bg-zinc-50/80 flex flex-col justify-center space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-semibold">
                TIMBRADO N° {invoice.timbrado || WORKSHOP_CONFIG.timbrado}
              </span>
              <span className="text-[10px] text-zinc-500">
                Válido hasta: {invoice.valid_until || WORKSHOP_CONFIG.validUntil}
              </span>
              <span className="text-xs font-bold font-mono text-zinc-900 pt-0.5">
                RUC: {WORKSHOP_CONFIG.ruc}
              </span>
              <span className="text-sm font-black tracking-widest text-zinc-900 pt-0.5">FACTURA</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-red-600">
                N° {invoice.invoice_number}
              </span>
            </div>
          </div>

          {/* 2. Datos del Cliente y Emisión */}
          <div className="border border-zinc-300 rounded p-3 bg-zinc-50/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-zinc-500 text-[11px]">Fecha de Emisión:</p>
              <p className="font-semibold text-zinc-900">
                {invoice.date
                  ? new Date(invoice.date + "T00:00:00").toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Fecha actual"}
              </p>
            </div>

            <div>
              <p className="text-zinc-500 text-[11px]">Condición de Venta:</p>
              <span className="inline-block px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 font-bold text-[11px]">
                {invoice.condition.toUpperCase()}
              </span>
            </div>

            <div>
              <p className="text-zinc-500 text-[11px]">Cliente / Razón Social:</p>
              <p className="font-bold text-zinc-900">{client.name}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-[11px]">R.U.C. / C.I.:</p>
              <p className="font-bold font-mono text-zinc-900">{client.document || "Sin Documento"}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-[11px]">Dirección:</p>
              <p className="text-zinc-800">{client.address || "Asunción, Paraguay"}</p>
            </div>

            <div>
              <p className="text-zinc-500 text-[11px]">Teléfono:</p>
              <p className="text-zinc-800">{client.phone || "No especificado"}</p>
            </div>
          </div>

          {/* 3. Desglose de Presupuestos agrupados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <Car className="h-4 w-4 text-zinc-600" /> Presupuestos y Trabajos Facturados ({repairs.length})
            </h4>

            <div className="border border-zinc-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-300">
                  <tr>
                    <th className="p-2 text-center w-12">Cant.</th>
                    <th className="p-2">Descripción de Trabajos y Repuestos</th>
                    <th className="p-2 text-right">P. Unitario</th>
                    <th className="p-2 text-right w-24">Exentas</th>
                    <th className="p-2 text-right w-20">5%</th>
                    <th className="p-2 text-right w-28">10%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {repairs.map((rep, idx) => {
                    const v = rep.vehicle
                    const vehicleLabel = v ? `${v.brand} ${v.model} (${v.plate})` : "Vehículo"

                    return (
                      <React.Fragment key={idx}>
                        <tr className="bg-zinc-100/70 border-t border-b border-zinc-300 font-medium">
                          <td colSpan={6} className="p-2 text-zinc-900">
                            <span className="font-mono font-bold text-[11px]">
                              #PRES-{rep.repair_id ? rep.repair_id.slice(0, 8).toUpperCase() : `ORD-${idx + 1}`}
                            </span>
                            <span className="text-zinc-400 mx-1.5">|</span>
                            <strong className="text-zinc-800">🚗 {vehicleLabel}</strong>
                            <span className="text-zinc-400 mx-1.5">|</span>
                            <span className="text-zinc-600 italic">Trabajo: {rep.reason}</span>
                          </td>
                        </tr>

                        {rep.items && rep.items.length > 0 ? (
                          rep.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="hover:bg-zinc-50">
                              <td className="p-2 text-center text-zinc-600">{item.quantity}</td>
                              <td className="p-2 font-medium text-zinc-800 pl-4">
                                • {item.description}
                              </td>
                              <td className="p-2 text-right text-zinc-600 font-mono">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="p-2 text-right text-zinc-400 font-mono">0</td>
                              <td className="p-2 text-right text-zinc-400 font-mono">0</td>
                              <td className="p-2 text-right font-bold text-zinc-900 font-mono">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-zinc-50">
                            <td className="p-2 text-center text-zinc-600">1</td>
                            <td className="p-2 font-medium text-zinc-800 pl-4">• {rep.reason}</td>
                            <td className="p-2 text-right text-zinc-600 font-mono">
                              {formatCurrency(rep.budget_total)}
                            </td>
                            <td className="p-2 text-right text-zinc-400 font-mono">0</td>
                            <td className="p-2 text-right text-zinc-400 font-mono">0</td>
                            <td className="p-2 text-right font-bold text-zinc-900 font-mono">
                              {formatCurrency(rep.budget_total)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Valor en Letras y Total General */}
          <div className="border border-zinc-900 rounded p-3 bg-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Valor en letras:</span>
              <p className="text-xs font-bold text-zinc-900">{amountWords}</p>
            </div>
            <div className="text-right sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total a Pagar:</span>
              <span className="font-mono text-lg sm:text-xl font-black text-emerald-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* 5. Liquidación del IVA Oficial */}
          <div className="grid grid-cols-3 gap-2 border border-zinc-300 rounded p-2.5 bg-white text-center text-xs">
            <div>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Liquidación IVA 5%</span>
              <span className="font-mono font-bold text-zinc-700">₲ 0</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Liquidación IVA 10%</span>
              <span className="font-mono font-bold text-zinc-900">
                {formatCurrency(invoice.tax_10 || Math.round(total / 11))}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase block">TOTAL IVA</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatCurrency(invoice.tax_total || Math.round(total / 11))}
              </span>
            </div>
          </div>

          {/* Pie */}
          <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-2 border-t border-zinc-200">
            <span>Comprobante válido para crédito fiscal conforme a la Ley N° 6380/19</span>
            <span className="font-bold text-zinc-600">ORIGINAL: CLIENTE / DUPLICADO: ARCHIVO</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
