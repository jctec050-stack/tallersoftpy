import Image from "next/image"
import { getVehicleByPlateOrId } from "@/actions/vehicles"
import { getVehicleRepairHistory } from "@/actions/repairs"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { Badge } from "@/components/ui/badge"
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Gauge,
  Phone,
  MessageCircle,
  MapPin,
  Car,
  ShieldCheck,
  Disc,
  RotateCw,
  Droplet,
  Cog,
  ClipboardCheck,
} from "lucide-react"

interface BudgetItem {
  description: string
  quantity: number
  price?: number
  total: number
}

interface RepairHistoryItem {
  id: string
  entry_date: string | null
  status: string
  budget_total: number | null
  reason: string
  diagnosis: string | null
  mileage?: number | null
  mechanic?: {
    name: string
  } | null
  budget_items?: BudgetItem[] | null
}

interface PublicVehiclePortalProps {
  params: Promise<{ id: string }>
}

export default async function PublicVehiclePortal({ params }: PublicVehiclePortalProps) {
  const { id } = await params
  const vehicle = await getVehicleByPlateOrId(id)

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Vehículo No Encontrado</h1>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              No encontramos registros para el código o chapa <strong>&quot;{id}&quot;</strong>. Por favor verifique el código QR escaneado o contacte al Taller San Luis.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="https://wa.me/595983535121"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    )
  }

  const repairs = await getVehicleRepairHistory(vehicle.id)
  const client = vehicle.client

  // Cálculos de Mantenimiento y Cuenta Regresiva
  const currentMileage = vehicle.mileage || 0
  const latestRepair = repairs[0]

  // Encontrar el último servicio registrado (o última reparación, o fecha de registro)
  const lastServiceDate = latestRepair?.entry_date
    ? new Date(latestRepair.entry_date)
    : vehicle.created_at
    ? new Date(vehicle.created_at)
    : new Date()

  const today = new Date()
  const diffTime = today.getTime() - lastServiceDate.getTime()
  const daysSinceLastService = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  // Intervalo recomendado: 180 días (6 meses) o +5.000 km
  const intervalDays = 180
  const daysRemaining = intervalDays - daysSinceLastService

  // Kilometraje estimado para el próximo service de motor
  const nextServiceMileage =
    currentMileage > 0
      ? Math.ceil((currentMileage + 500) / 5000) * 5000
      : 5000
  const kmRemaining = Math.max(0, nextServiceMileage - currentMileage)

  // Kilometraje estimado para aceite de caja & diferencial (cada 40.000 km)
  const nextGearboxMileage =
    currentMileage > 0
      ? Math.ceil((currentMileage + 2000) / 40000) * 40000
      : 40000

  // Kilometraje estimado para revisión completa integral (cada 20.000 km)
  const nextFullReviewMileage =
    currentMileage > 0
      ? Math.ceil((currentMileage + 1000) / 20000) * 20000
      : 20000

  // Kilometraje estimado para frenos y alineación (cada 10.000 km)
  const nextBrakesMileage =
    currentMileage > 0
      ? Math.ceil((currentMileage + 500) / 10000) * 10000
      : 10000

  const nextAlignmentMileage =
    currentMileage > 0
      ? Math.ceil((currentMileage + 500) / 10000) * 10000
      : 10000

  // Próxima fecha estimada
  const nextServiceEstimatedDate = new Date(lastServiceDate)
  nextServiceEstimatedDate.setDate(nextServiceEstimatedDate.getDate() + intervalDays)

  // Determinar estado de salud
  let healthStatus: "overdue" | "warning" | "good" = "good"
  if (daysRemaining < 0) {
    healthStatus = "overdue"
  } else if (daysRemaining <= 20) {
    healthStatus = "warning"
  } else {
    healthStatus = "good"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const whatsappMessage = `Hola Taller San Luis, deseo agendar el próximo mantenimiento de mi vehículo ${vehicle.brand} ${vehicle.model} (Chapa: ${vehicle.plate}). Mi kilometraje actual es de aprox. ${currentMileage.toLocaleString()} km.`

  return (
    <div className="min-h-screen bg-zinc-100/60 pb-12 antialiased">
      {/* Header Público / Branding Taller San Luis */}
      <header className="bg-zinc-950 text-white border-b border-zinc-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-9 shrink-0 flex items-center justify-center">
              <Image
                src="/logotaller.webp"
                alt="Logo Taller San Luis"
                width={36}
                height={45}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-zinc-100 block leading-tight">
                TALLER SAN LUIS
              </span>
              <span className="text-[10px] text-zinc-400 block -mt-0.5">
                Ficha Digital del Vehículo
              </span>
            </div>
          </div>

          <a
            href={generateWhatsAppLink("0983535121", `Hola Taller San Luis, me contacto desde la ficha digital del móvil ${vehicle.plate}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        {/* 1. Tarjeta Principal de Identidad del Móvil */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="space-y-1">
              <div className="inline-block border-2 border-zinc-900 rounded-md bg-zinc-950 px-3 py-0.5 shadow-2xs">
                <span className="font-mono text-lg sm:text-xl font-black tracking-widest text-white">
                  {vehicle.plate}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-xs text-zinc-500">
                Año: {vehicle.year || "S/D"} · Color: {vehicle.color || "S/D"}
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-left sm:text-right shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Kilometraje Registrado
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-zinc-900 flex items-center sm:justify-end gap-1.5">
                <Gauge className="h-4 w-4 text-zinc-600" />
                {currentMileage.toLocaleString()} km
              </span>
            </div>
          </div>

          {/* Propietario / Cliente */}
          {client && (
            <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50/70 p-3 rounded-xl border border-zinc-100">
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Titular del Vehículo</span>
                <span className="font-bold text-zinc-900">{client.name}</span>
                {client.document && (
                  <span className="text-zinc-500 block text-[11px]">RUC / C.I.: {client.document}</span>
                )}
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            </div>
          )}
        </div>

        {/* 2. ALERTA DE PRÓXIMO MANTENIMIENTO (Semáforo de Salud) */}
        <div
          className={`rounded-2xl p-5 border shadow-xs space-y-3 ${
            healthStatus === "overdue"
              ? "bg-red-50/90 border-red-200 text-red-950"
              : healthStatus === "warning"
              ? "bg-amber-50/90 border-amber-200 text-amber-950"
              : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  healthStatus === "overdue"
                    ? "bg-red-600 text-white"
                    : healthStatus === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {healthStatus === "overdue" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : healthStatus === "warning" ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  ESTADO DE MANTENIMIENTO
                </span>
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  {healthStatus === "overdue"
                    ? "Mantenimiento Vencido"
                    : healthStatus === "warning"
                    ? "Próximo Servicio en Breve"
                    : "Mantenimiento al Día"}
                </h2>
              </div>
            </div>

            <Badge
              className={`font-semibold text-xs px-2.5 py-1 uppercase ${
                healthStatus === "overdue"
                  ? "bg-red-600 text-white border-red-700"
                  : healthStatus === "warning"
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-emerald-600 text-white border-emerald-700"
              }`}
            >
              {healthStatus === "overdue" ? "Requiere Atención" : healthStatus === "warning" ? "Agendar" : "Óptimo"}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed opacity-90">
            {healthStatus === "overdue"
              ? `Han transcurrido ${daysSinceLastService} días desde su último servicio registrado. Le recomendamos agendar su mantenimiento preventivo a la brevedad para garantizar la vida útil de su motor.`
              : healthStatus === "warning"
              ? `Faltan aproximadamente ${daysRemaining} días o ${kmRemaining.toLocaleString()} km para su próximo servicio programado. ¡No deje pasar la fecha!`
              : `Su vehículo se encuentra dentro del período seguro de uso. Próximo mantenimiento recomendado en aproximadamente ${daysRemaining} días o ${kmRemaining.toLocaleString()} km.`}
          </p>

          {/* Métricas del Próximo Servicio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs">
            <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block truncate">Próx. Aceite Motor</span>
              <strong className="text-sm font-bold font-mono text-zinc-900 block mt-0.5">
                {nextServiceMileage.toLocaleString()} km
              </strong>
            </div>

            <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block truncate">Fecha Sugerida</span>
              <strong className="text-sm font-bold text-zinc-900 block mt-0.5">
                {nextServiceEstimatedDate.toLocaleDateString("es-PY")}
              </strong>
            </div>

            <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-purple-700 block truncate">Caja & Diferencial</span>
              <strong className="text-sm font-bold font-mono text-zinc-900 block mt-0.5">
                ~{nextGearboxMileage.toLocaleString()} km
              </strong>
            </div>

            <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-indigo-700 block truncate">Revisión Completa</span>
              <strong className="text-sm font-bold font-mono text-zinc-900 block mt-0.5">
                ~{nextFullReviewMileage.toLocaleString()} km
              </strong>
            </div>
          </div>

          {/* Botón Agendar Turno Directo */}
          <div className="pt-2">
            <a
              href={generateWhatsAppLink("0983535121", whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>Agendar Turno de Mantenimiento por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 3. Servicios Preventivos Recomendados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-zinc-800" /> Servicios Periódicos Preventivos
            </h3>
            <span className="text-[11px] text-zinc-400">Guía Técnica San Luis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Aceite y Filtro de Motor */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Droplet className="h-4 w-4 text-amber-500" />
                <span>Aceite de Motor & Filtros</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Cambio de aceite multigrado / sintético y sustitución de filtro de aceite y combustible.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  Cada 5.000 km o 6 meses
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded inline-block">
                    Próximo: ~{nextServiceMileage.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Inspección de Frenos */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Disc className="h-4 w-4 text-red-500" />
                <span>Inspección de Frenos</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Control de espesor de pastillas, estado de discos, zapatas y líquido de frenos.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  Cada 10.000 km o 1 año
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200/60 px-2 py-0.5 rounded inline-block">
                    Próximo: ~{nextBrakesMileage.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Aceite de Caja y Diferencial */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Cog className="h-4 w-4 text-purple-600" />
                <span>Aceite de Caja & Diferencial</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Sustitución de lubricante para transmisión (manual o automática) y fluido de diferencial para proteger engranajes.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  Cada 40.000 km o 2 años
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded inline-block">
                    Próximo: ~{nextGearboxMileage.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Próxima Revisión Completa */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                <span>Próxima Revisión Completa</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Diagnóstico integral de 25+ puntos: escaneo computarizado OBD-II, sistema de carga, batería, correas y fluidos.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  Cada 20.000 km o 1 año
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded inline-block">
                    Próximo: ~{nextFullReviewMileage.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Alineación y Balanceo */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <RotateCw className="h-4 w-4 text-blue-500" />
                <span>Alineación & Balanceo</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Rotación de neumáticos y calibración para evitar desgaste prematuro de cubiertas.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  Cada 10.000 km
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded inline-block">
                    Próximo: ~{nextAlignmentMileage.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Tren Delantero y Suspensión */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Wrench className="h-4 w-4 text-emerald-500" />
                <span>Suspensión & Tren Delantero</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Revisión de bujes, amortiguadores, rótulas y terminales de dirección.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded inline-block">
                  En cada service
                </span>
                {currentMileage > 0 && (
                  <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded inline-block">
                    Inspección continua
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. HISTORIAL DE REPARACIONES Y SERVICIOS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-800" /> Historial de Servicios ({repairs.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Orden cronológico</span>
          </div>

          {repairs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500 text-xs space-y-2">
              <Car className="h-8 w-8 mx-auto text-zinc-300" />
              <p className="font-semibold text-zinc-800 text-sm">Sin reparaciones registradas aún</p>
              <p className="text-zinc-400">
                A medida que su vehículo ingrese al Taller San Luis, las órdenes y repuestos aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(repairs as unknown as RepairHistoryItem[]).map((r: RepairHistoryItem, idx: number) => {
                const isLatest = idx === 0
                const items: BudgetItem[] = (r.budget_items as BudgetItem[]) || []
                const repairMileage = r.mileage || (isLatest && vehicle.mileage ? vehicle.mileage : null)

                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                      isLatest
                        ? "border-zinc-900 ring-1 ring-zinc-900 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                            #PRES-{r.id.slice(0, 8)}
                          </span>
                          {isLatest && (
                            <Badge className="bg-zinc-900 text-white text-[10px] uppercase">
                              Último Servicio
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              r.status === "Completado" || r.status === "Entregado"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            <span>Fecha de Ingreso: {r.entry_date ? new Date(r.entry_date).toLocaleDateString("es-PY") : "S/F"}</span>
                          </span>
                          {repairMileage !== null && repairMileage !== undefined && Number(repairMileage) > 0 && (
                            <>
                              <span className="text-zinc-300">•</span>
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-700 bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-[10px]">
                                <Gauge className="h-3 w-3 text-zinc-600" />
                                <span>{Number(repairMileage).toLocaleString()} km</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {r.budget_total ? (
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total</span>
                          <span className="font-mono text-xs sm:text-sm font-bold text-zinc-900">
                            {formatCurrency(r.budget_total)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Trabajo Realizado */}
                    <div className="bg-zinc-50 rounded-xl p-3 text-xs space-y-1 border border-zinc-100">
                      <p className="text-zinc-800 break-words leading-relaxed">
                        <strong className="text-zinc-950">Motivo:</strong> {r.reason}
                      </p>
                      {r.diagnosis && (
                        <p className="text-zinc-600 italic break-words leading-relaxed pt-0.5 border-t border-zinc-200/60">
                          <strong className="text-zinc-800 not-italic">Diagnóstico:</strong> {r.diagnosis}
                        </p>
                      )}
                      {r.mechanic?.name && (
                        <p className="text-zinc-500 text-[11px] pt-0.5">
                          Técnico responsable: <strong>{r.mechanic.name}</strong>
                        </p>
                      )}
                    </div>

                    {/* Repuestos y Servicios Cargados */}
                    {items.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Detalle de Repuestos y Trabajos ({items.length})
                        </span>
                        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 overflow-hidden text-xs">
                          {items.map((item: BudgetItem, i: number) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-white hover:bg-zinc-50/50">
                              <span className="text-zinc-700 font-medium">
                                • {item.description} {item.quantity > 1 ? `(${item.quantity}x)` : ""}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-900 font-bold shrink-0">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 5. Tarjeta de Contacto / Taller San Luis */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3 text-center shadow-xs">
          <div className="h-10 w-9 mx-auto relative flex items-center justify-center">
            <Image
              src="/logotaller.webp"
              alt="Logo Taller San Luis"
              width={36}
              height={45}
              className="h-full w-auto object-contain"
            />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">
              TALLER MECÁNICO SAN LUIS
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Servicio Automotriz Multimarca & Mantenimiento Especializado
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              Hernandarias, Paraguay
            </span>
            <span className="hidden sm:inline text-zinc-300">·</span>
            <a href="tel:0983535121" className="flex items-center gap-1.5 hover:text-blue-600 font-medium">
              <Phone className="h-3.5 w-3.5 text-zinc-500" />
              0983 535 121
            </a>
          </div>

          <div className="pt-2">
            <a
              href="https://wa.me/595983535121"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contactar con el Taller por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-zinc-400 space-y-1">
          <p>© {new Date().getFullYear()} Taller Mecánico San Luis. Todos los derechos reservados.</p>
          <p>Ficha de control generada mediante código QR vehicular.</p>
        </div>
      </main>
    </div>
  )
}
