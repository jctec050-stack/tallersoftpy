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
import { QrCode, Printer, Download, Copy, Check, ExternalLink, ShieldCheck, Loader2 } from "lucide-react"
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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawShieldCheck(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.strokeStyle = "#059669"
  ctx.lineWidth = 2.2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const scale = size / 24
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  const shield = new Path2D("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")
  ctx.stroke(shield)

  const check = new Path2D("m9 12 2 2 4-4")
  ctx.stroke(check)
  ctx.restore()
}

function drawPhoneIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.strokeStyle = "#09090b"
  ctx.lineWidth = 2.2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const scale = size / 24
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  const phone = new Path2D("M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z")
  ctx.stroke(phone)
  ctx.beginPath()
  ctx.arc(12, 19, 1, 0, Math.PI * 2)
  ctx.fillStyle = "#09090b"
  ctx.fill()
  ctx.restore()
}

function fillWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ")
  let line = ""
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Error al cargar imagen " + src))
    img.src = src
  })
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
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

  // Descarga la tarjeta completa exactamente con todo su formato
  const handleDownloadCard = async () => {
    if (!qrUrl) return
    setIsGeneratingImage(true)
    try {
      const canvas = document.createElement("canvas")
      const baseWidth = 800
      const baseHeight = 1040
      const scale = 0.625 // Escala la imagen a 500 x 650 px (formato compacto / mitad de hoja A4)
      const width = baseWidth
      const height = baseHeight
      canvas.width = Math.round(baseWidth * scale) // 500 px
      canvas.height = Math.round(baseHeight * scale) // 650 px
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.scale(scale, scale)

      // Fondo blanco exterior
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      // Borde exterior redondeado de la tarjeta (como en el formato del modal)
      drawRoundedRect(ctx, 24, 24, width - 48, height - 48, 28)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = "#09090b"
      ctx.stroke()

      // 1. Logo del Taller
      try {
        const logo = await loadImage("/logotaller.webp")
        ctx.drawImage(logo, 60, 56, 50, 62)
      } catch (e) {
        console.warn("Logo no disponible para canvas", e)
      }

      // Nombre del Taller
      ctx.fillStyle = "#09090b"
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("TALLER SAN LUIS", 125, 86)

      // Subtítulo
      ctx.fillStyle = "#71717a"
      ctx.font = "500 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.fillText("Hernandarias · Tel: 0975 882 828", 125, 112)

      // Badge HISTORIAL DIGITAL
      const badgeText = "HISTORIAL DIGITAL"
      ctx.font = "bold 14px monospace, -apple-system, sans-serif"
      const badgeWidth = ctx.measureText(badgeText).width + 24
      const badgeHeight = 32
      const badgeX = width - 60 - badgeWidth
      const badgeY = 70
      drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 16)
      ctx.fillStyle = "#09090b"
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 21)

      // Línea divisoria superior
      ctx.beginPath()
      ctx.moveTo(60, 142)
      ctx.lineTo(width - 60, 142)
      ctx.lineWidth = 3
      ctx.strokeStyle = "#09090b"
      ctx.stroke()

      // 2. Caja de Datos del Vehículo (gris suave)
      const boxY = 165
      const boxH = 175
      drawRoundedRect(ctx, 60, boxY, width - 120, boxH, 18)
      ctx.fillStyle = "#f4f4f5"
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = "#e4e4e7"
      ctx.stroke()

      // Badge de Chapa (blanco con borde oscuro)
      const plateWidth = 240
      const plateHeight = 52
      const plateX = (width - plateWidth) / 2
      const plateY = boxY + 16
      drawRoundedRect(ctx, plateX, plateY, plateWidth, plateHeight, 10)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = "#09090b"
      ctx.stroke()

      ctx.fillStyle = "#09090b"
      ctx.font = "900 30px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      ctx.textAlign = "center"
      ctx.fillText(vehicle.plate, width / 2, plateY + 37)

      // Modelo de vehículo
      const vehicleDesc = `${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}`
      ctx.fillStyle = "#09090b"
      ctx.font = "bold 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.fillText(vehicleDesc, width / 2, boxY + 112)

      // Propietario
      if (vehicle.client?.name) {
        ctx.fillStyle = "#52525b"
        ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        ctx.fillText(`Propietario: ${vehicle.client.name}`, width / 2, boxY + 146)
      }

      // 3. Contenedor de Código QR
      const qrBoxSize = 390
      const qrBoxX = (width - qrBoxSize) / 2
      const qrBoxY = 365
      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = "#e4e4e7"
      ctx.stroke()

      const qrImg = await loadImage(qrUrl)
      ctx.drawImage(qrImg, qrBoxX + 16, qrBoxY + 16, qrBoxSize - 32, qrBoxSize - 32)

      // Textos debajo del QR
      ctx.fillStyle = "#09090b"
      const phoneText = "ESCANEE CON SU CELULAR"
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      const phoneTextWidth = ctx.measureText(phoneText).width
      const phoneIconSize = 22
      const phoneGap = 10
      const totalPhoneWidth = phoneIconSize + phoneGap + phoneTextWidth
      const phoneStartX = (width - totalPhoneWidth) / 2
      drawPhoneIcon(ctx, phoneStartX, 786, phoneIconSize)

      ctx.fillStyle = "#09090b"
      ctx.textAlign = "left"
      ctx.fillText(phoneText, phoneStartX + phoneIconSize + phoneGap, 804)

      ctx.fillStyle = "#71717a"
      ctx.font = "500 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.textAlign = "center"
      fillWrappedText(
        ctx,
        "Vea su historial de reparaciones y cuándo le toca el próximo service.",
        width / 2,
        832,
        460,
        24
      )

      // 4. Footer
      ctx.beginPath()
      ctx.moveTo(60, 950)
      ctx.lineTo(width - 60, 950)
      ctx.lineWidth = 1.5
      ctx.strokeStyle = "#e4e4e7"
      ctx.stroke()

      // Garantía San Luis (vector con escudo verde)
      drawShieldCheck(ctx, 60, 969, 22)
      ctx.fillStyle = "#71717a"
      ctx.font = "500 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("Garantía San Luis", 90, 986)

      // Kilometraje en el footer
      if (vehicle.mileage) {
        ctx.fillStyle = "#71717a"
        ctx.font = "500 17px ui-monospace, monospace"
        ctx.textAlign = "right"
        ctx.fillText(`${vehicle.mileage.toLocaleString()} km`, width - 60, 986)
      }

      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement("a")
        const url = URL.createObjectURL(blob)
        a.href = url
        a.download = `Ficha-QR-${vehicle.plate}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, "image/png")
    } catch (err) {
      console.error("Error al generar imagen de la tarjeta QR:", err)
      // Fallback en caso imprevisto
      const a = document.createElement("a")
      a.href = qrUrl
      a.download = `QR-${vehicle.plate}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Imprime mediante iframe aislado para evitar recortes causados por el overflow del diálogo
  const handlePrint = () => {
    let iframe = document.getElementById("print-qr-iframe") as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement("iframe")
      iframe.id = "print-qr-iframe"
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "none"
      document.body.appendChild(iframe)
    }

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    const mileageText = vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : ""
    const clientName = vehicle.client?.name || ""
    const vehicleText = `${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ""}`

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ficha QR - ${vehicle.plate}</title>
        <style>
          @page {
            margin: 10mm;
            size: auto;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            background: #ffffff;
            color: #09090b;
          }
          .card {
            width: 370px;
            border: 2px solid #09090b;
            border-radius: 20px;
            padding: 20px;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #09090b;
            padding-bottom: 12px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo {
            width: 36px;
            height: 45px;
            object-fit: contain;
          }
          .shop-title {
            font-size: 13.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            line-height: 1.2;
          }
          .shop-subtitle {
            font-size: 10px;
            color: #52525b;
            margin-top: 1px;
          }
          .badge-historial {
            background: #09090b;
            color: #ffffff;
            font-family: monospace;
            font-size: 9.5px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
          }
          .vehicle-box {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 14px;
            padding: 12px 10px;
            margin: 12px 0;
            text-align: center;
          }
          .plate-box {
            display: inline-block;
            border: 2px solid #09090b;
            border-radius: 6px;
            background: #ffffff;
            padding: 2px 12px;
            margin-bottom: 5px;
          }
          .plate-text {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
          }
          .vehicle-desc {
            font-size: 12.5px;
            font-weight: 800;
            color: #09090b;
          }
          .owner-text {
            font-size: 10.5px;
            color: #52525b;
            margin-top: 2px;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 12px 0;
          }
          .qr-img-wrapper {
            background: #ffffff;
            padding: 8px;
            border-radius: 14px;
            border: 1px solid #e4e4e7;
            display: inline-block;
          }
          .qr-img {
            width: 200px;
            height: 200px;
            display: block;
          }
          .qr-hint-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            margin-top: 8px;
            letter-spacing: 0.2px;
          }
          .qr-hint-sub {
            font-size: 9.5px;
            color: #71717a;
            max-width: 260px;
            text-align: center;
            margin-top: 2px;
            line-height: 1.25;
          }
          .footer {
            border-top: 1px solid #e4e4e7;
            padding-top: 8px;
            margin-top: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 10px;
            color: #71717a;
          }
          .footer-left {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #059669;
            font-weight: 600;
          }
          .footer-km {
            font-family: monospace;
            font-weight: 600;
            color: #52525b;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="header-left">
              <img src="/logotaller.webp" class="logo" alt="Logo" />
              <div>
                <div class="shop-title">TALLER SAN LUIS</div>
                <div class="shop-subtitle">Hernandarias · Tel: 0975 882 828</div>
              </div>
            </div>
            <div class="badge-historial">HISTORIAL DIGITAL</div>
          </div>

          <div class="vehicle-box">
            <div class="plate-box">
              <span class="plate-text">${vehicle.plate}</span>
            </div>
            <div class="vehicle-desc">${vehicleText}</div>
            ${clientName ? `<div class="owner-text">Propietario: <strong>${clientName}</strong></div>` : ""}
          </div>

          <div class="qr-container">
            <div class="qr-img-wrapper">
              <img src="${qrUrl}" class="qr-img" alt="QR ${vehicle.plate}" />
            </div>
            <div class="qr-hint-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
              </svg>
              ESCANEE CON SU CELULAR
            </div>
            <div class="qr-hint-sub">Vea su historial de reparaciones y cuándo le toca el próximo service.</div>
          </div>

          <div class="footer">
            <span class="footer-left">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Garantía San Luis
            </span>
            <span class="footer-km">${mileageText}</span>
          </div>
        </div>
        <script>
          let printed = false;
          function doPrint() {
            if (printed) return;
            printed = true;
            window.focus();
            window.print();
          }
          window.addEventListener('load', () => setTimeout(doPrint, 120));
          setTimeout(doPrint, 450);
        </script>
      </body>
      </html>
    `)
    doc.close()
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
                    Hernandarias · Tel: 0975 882 828
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
                onClick={handleDownloadCard}
                disabled={!qrUrl || isGeneratingImage}
                className="w-full border-zinc-300 font-semibold text-xs h-10 hover:bg-zinc-100"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-zinc-600" /> Guardando...
                  </>
                ) : (
                  <>
                    <Download className="mr-1.5 h-4 w-4 text-zinc-600" /> Guardar Imagen
                  </>
                )}
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
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          body > *:not([data-slot="dialog-portal"]):not([data-base-ui-portal]) {
            display: none !important;
          }
          [data-slot="dialog-overlay"] {
            display: none !important;
          }
          [data-slot="dialog-content"] {
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
          }
          [data-slot="dialog-content"] > *:not(#printable-vehicle-qr-card) {
            display: none !important;
          }
          #printable-vehicle-qr-card {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            margin: 20px auto !important;
            max-width: 380px !important;
            width: 380px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  )
}

