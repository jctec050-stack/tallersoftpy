"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { QrCode, Printer, Download, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react"
import { getAppBaseUrl } from "@/lib/utils"

interface VehicleQrModalProps {
  vehicle: {
    id: string
    plate: string
    brand: string
    model: string
    year?: number
    color?: string
    mileage?: number
    client?: {
      name: string
      phone?: string
      document?: string
    }
  }
  buttonVariant?: "default" | "outline" | "ghost" | "secondary"
  compact?: boolean
}

export function VehicleQrModal({
  vehicle,
  buttonVariant = "outline",
  compact = false,
}: VehicleQrModalProps) {
  const [open, setOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>("")
  const [portalUrl, setPortalUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || typeof window === "undefined") return

    const origin = getAppBaseUrl()
    const url = `${origin}/v/${encodeURIComponent(vehicle.plate || vehicle.id)}`

    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((dataUri) => {
        setPortalUrl(url)
        setQrUrl(dataUri)
      })
      .catch((err) => {
        console.error("Error generating QR:", err)
      })
  }, [open, vehicle.id, vehicle.plate])

  const handleCopy = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!qrUrl) return
    const a = document.createElement("a")
    a.href = qrUrl
    a.download = `QR-Vehiculo-${vehicle.plate}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant={buttonVariant}
              size="sm"
              className={`font-semibold text-xs h-8 ${
                compact ? "px-2" : "px-2.5"
              } bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white shadow-xs`}
              title="Generar e Imprimir QR de Mantenimiento"
            />
          }
        >
          <QrCode className="h-3.5 w-3.5 shrink-0 mr-1.5" />
          {compact ? (
            <span>QR</span>
          ) : (
            <>
              <span className="hidden sm:inline">Imprimir </span>QR
            </>
          )}
        </DialogTrigger>

        <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-zinc-900">
              <QrCode className="h-5 w-5 text-zinc-900 shrink-0" />
              <span>QR de Mantenimiento del Vehículo</span>
            </DialogTitle>
            <p className="text-xs text-zinc-500">
              Adhesivo / Tarjeta física para el parabrisas o guantera. El cliente escanea el código para ver su historial y avisos de mantenimiento.
            </p>
          </DialogHeader>

          {/* Tarjeta Imprimible de Mantenimiento */}
          <div
            id="printable-vehicle-qr-card"
            ref={printRef}
            className="my-3 rounded-2xl border-2 border-zinc-900 bg-white p-4 sm:p-5 text-zinc-900 shadow-sm space-y-3 print:border-2 print:border-black print:m-0 print:p-6"
          >
            {/* Header Tarjeta */}
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-9 shrink-0 flex items-center justify-center">
                  <Image
                    src="/logotaller.webp"
                    alt="Logo Taller San Luis"
                    width={36}
                    height={45}
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-950 leading-tight">
                    TALLER SAN LUIS
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                    Hernandarias · Tel: 0983 535 121
                  </p>
                </div>
              </div>

              <Badge className="bg-zinc-900 text-white font-mono font-bold text-[10px] uppercase px-2 py-0.5">
                HISTORIAL DIGITAL
              </Badge>
            </div>

            {/* Datos del Móvil / Vehículo */}
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-center space-y-1">
              <div className="inline-block border-2 border-zinc-900 rounded-md bg-white px-3 py-0.5 shadow-2xs">
                <span className="font-mono text-base sm:text-lg font-black tracking-widest text-zinc-950">
                  {vehicle.plate}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-zinc-900">
                {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
              </p>
              {vehicle.client && (
                <p className="text-[11px] text-zinc-500">
                  Propietario: <strong className="text-zinc-800">{vehicle.client.name}</strong>
                </p>
              )}
            </div>

            {/* Código QR */}
            <div className="flex flex-col items-center justify-center py-2">
              {qrUrl ? (
                <div className="bg-white p-2 rounded-xl border border-zinc-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`QR para ${vehicle.plate}`}
                    className="h-44 w-44 sm:h-52 sm:w-52 object-contain"
                  />
                </div>
              ) : (
                <div className="h-44 w-44 rounded-xl bg-zinc-100 animate-pulse flex items-center justify-center text-xs text-zinc-400">
                  Generando QR...
                </div>
              )}
              <div className="mt-2 text-center max-w-[280px]">
                <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-tight">
                  📱 Escanee con su celular
                </p>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Vea su historial de reparaciones y cuándo le toca el próximo service.
                </p>
              </div>
            </div>

            {/* Footer de la tarjeta */}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Garantía San Luis
              </span>
              <span className="font-mono">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : ""}</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handlePrint}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs h-10 shadow-xs"
              >
                <Printer className="mr-1.5 h-4 w-4" /> Imprimir Tarjeta
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={!qrUrl}
                className="w-full border-zinc-300 font-semibold text-xs h-10 hover:bg-zinc-100"
              >
                <Download className="mr-1.5 h-4 w-4" /> Guardar Imagen
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopy}
                className="flex-1 text-xs text-zinc-600 hover:text-zinc-900 h-9"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> ¡Enlace Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5 text-zinc-500" /> Copiar Enlace
                  </>
                )}
              </Button>

              {portalUrl && (
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir Ficha
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estilos específicos para impresión directa de la tarjeta */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-vehicle-qr-card,
          #printable-vehicle-qr-card * {
            visibility: visible;
          }
          #printable-vehicle-qr-card {
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            width: 320px !important;
            margin: 0 auto !important;
            border: 2px solid black !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  )
}
