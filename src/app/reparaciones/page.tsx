import { getRepairs } from "@/actions/repairs"
import { RepairForm } from "@/components/forms/RepairForm"
import { EditRepairModal, DeleteRepairButton } from "@/components/repairs/RepairActions"
import { DigitalBudgetModal } from "@/components/repairs/DigitalBudgetModal"
import { VehicleHistoryModal } from "@/components/repairs/VehicleHistoryModal"
import { RepairStatusSelect } from "@/components/repairs/RepairStatusSelect"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import Link from "next/link"
import { Wrench, Plus, Eye, Calendar, AlertTriangle, Image as ImageIcon, Car, Clock, CheckCircle2, ShieldAlert, Phone, ExternalLink } from "lucide-react"

export default async function ReparacionesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const { repairs, error: fetchError } = await getRepairs(q)

  const activeRepairs = repairs?.filter((r: any) => r.status !== "Completado" && r.status !== "Entregado").length || 0
  const highPriorityCount = repairs?.filter((r: any) => r.priority === "Alta").length || 0
  const budgetedCount = repairs?.filter((r: any) => r.status === "Presupuestado" || r.budget_status === "Aprobado").length || 0
  const completedCount = repairs?.filter((r: any) => r.status === "Completado" || r.status === "Entregado").length || 0

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 font-semibold">🔴 Alta</Badge>
      case "Media":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold">🟡 Media</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold">🟢 Baja</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
      case "Entregado":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">✅ {status}</Badge>
      case "En Reparación":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">⚙️ {status}</Badge>
      case "Presupuestado":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">💰 {status}</Badge>
      case "En Diagnóstico":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">🔍 {status}</Badge>
      default:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200">⏳ {status}</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Gestión de Reparaciones</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Órdenes de trabajo, diagnósticos, fotos previas y presupuestos digitales.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Orden de Reparación
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Orden de Reparación</DialogTitle>
            </DialogHeader>
            <RepairForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Database Error or Setup Notice */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-amber-900">Aviso sobre la tabla 'repairs' en Supabase</p>
            <p className="text-amber-700 text-xs">{fetchError}</p>
            <details className="text-xs bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 text-amber-950 font-mono">
              <summary className="font-semibold cursor-pointer text-amber-900 mb-1 font-sans">
                👉 Haz clic para ver el comando SQL para crear la tabla en Supabase
              </summary>
              <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto pt-2">
{`CREATE TABLE IF NOT EXISTS repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  entry_date DATE DEFAULT CURRENT_DATE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  diagnosis TEXT,
  priority VARCHAR(20) DEFAULT 'Media',
  status VARCHAR(30) DEFAULT 'Pendiente',
  photos TEXT[],
  budget_items JSONB DEFAULT '[]'::jsonb,
  budget_total NUMERIC(12,2) DEFAULT 0,
  budget_status VARCHAR(20) DEFAULT 'Borrador'
);

ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo acceso a repairs" ON repairs FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Activas
              </span>
              <div className="p-1.5 sm:p-2 bg-zinc-100 rounded-lg text-zinc-900 shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{activeRepairs}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Alta Prioridad
              </span>
              <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-red-600 shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{highPriorityCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Presupuestados
              </span>
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{budgetedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
                Completados
              </span>
              <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchInput placeholder="Buscar por motivo, diagnóstico o prioridad..." />
      </div>

      {/* Mobile Cards View (Visible only on mobile devices) */}
      <div className="md:hidden space-y-3">
        {(!repairs || repairs.length === 0) ? (
          <div className="text-center py-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-500">
            <Wrench className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
            <p className="font-semibold text-zinc-800 text-sm">No hay órdenes de reparación</p>
            <p className="text-xs text-zinc-500 mt-1">Toca en "Nueva Orden de Reparación" para registrar un trabajo.</p>
          </div>
        ) : (
          repairs.map((repair: any) => {
            const vehicle = repair.vehicle
            const client = vehicle?.client
            const photoCount = repair.photos?.length || 0

            return (
              <div key={repair.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                {/* Header: Vehicle Plate, Model & Priority */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {vehicle ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                          {vehicle.plate}
                        </Badge>
                        <span className="font-bold text-zinc-900 text-sm">{vehicle.brand} {vehicle.model}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Sin vehículo asignado</span>
                    )}
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(repair.entry_date).toLocaleDateString("es-PY")}
                    </span>
                  </div>
                  {getPriorityBadge(repair.priority)}
                </div>

                {/* Motivo & Diagnóstico */}
                <div className="rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-700 space-y-1">
                  <p className="break-words leading-relaxed"><span className="font-semibold text-zinc-900">Motivo:</span> {repair.reason}</p>
                  {repair.diagnosis && (
                    <p className="text-zinc-600 italic break-words leading-relaxed"><span className="font-semibold text-zinc-900">Diagnóstico:</span> {repair.diagnosis}</p>
                  )}
                </div>

                {/* Cliente & Contacto */}
                {client && (
                  <div className="flex items-center justify-between text-xs py-1 border-t border-zinc-100">
                    <span className="font-medium text-zinc-800">👤 {client.name}</span>
                    {client.phone && (
                      <a
                        href={generateWhatsAppLink(client.phone, `Hola ${client.name}, le saludamos de Taller San Luis sobre su vehículo ${vehicle?.brand} ${vehicle?.model}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md active:bg-emerald-100"
                      >
                        <Phone className="h-3 w-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {/* Status Selector & Photos */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-zinc-500">Estado:</span>
                    <RepairStatusSelect repairId={repair.id} currentStatus={repair.status} variant="badge" />
                  </div>
                  {photoCount > 0 && (
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 text-[11px]">
                      <ImageIcon className="h-3 w-3 mr-1 text-zinc-500" /> {photoCount} foto(s)
                    </Badge>
                  )}
                </div>

                {/* Quick Actions Footer */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-100 flex-wrap">
                  <Link
                    href={`/reparaciones/${repair.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Detalle
                  </Link>
                  <DigitalBudgetModal repair={repair} />
                  {vehicle?.id && (
                    <VehicleHistoryModal vehicleId={vehicle.id} plate={vehicle.plate} brand={vehicle.brand} model={vehicle.model} />
                  )}
                  <EditRepairModal repair={repair} />
                  <DeleteRepairButton repairId={repair.id} reason={repair.reason} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table (Hidden on small mobile screens) */}
      <div className="hidden md:block rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Ingreso</TableHead>
              <TableHead className="font-semibold text-zinc-700">Vehículo / Cliente</TableHead>
              <TableHead className="font-semibold text-zinc-700">Motivo y Diagnóstico</TableHead>
              <TableHead className="font-semibold text-zinc-700">Prioridad</TableHead>
              <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
              <TableHead className="font-semibold text-zinc-700">Fotos Previas</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!repairs || repairs.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Wrench className="h-8 w-8 text-zinc-300" />
                    <p className="font-medium text-zinc-700">
                      {fetchError ? "Sin conexión o tabla pendiente" : "No hay órdenes de reparación"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Haz clic en "Nueva Orden de Reparación" para registrar el primer trabajo.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((repair: any) => {
                const vehicle = repair.vehicle
                const client = vehicle?.client
                const photoCount = repair.photos?.length || 0

                return (
                  <TableRow key={repair.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <div className="flex items-center text-xs font-semibold text-zinc-700">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                        {new Date(repair.entry_date).toLocaleDateString("es-PY")}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        {vehicle ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                              {vehicle.plate}
                            </Badge>
                            <span className="font-semibold text-zinc-900 text-xs">{vehicle.brand} {vehicle.model}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Sin vehículo</span>
                        )}
                        {client && (
                          <span className="text-xs text-zinc-500 block mt-0.5">👤 {client.name}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium text-zinc-900 text-xs line-clamp-1">{repair.reason}</p>
                        {repair.diagnosis && (
                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5 italic">🔍 {repair.diagnosis}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getPriorityBadge(repair.priority)}
                    </TableCell>

                    <TableCell>
                      <RepairStatusSelect repairId={repair.id} currentStatus={repair.status} variant="badge" />
                    </TableCell>

                    <TableCell>
                      {photoCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 text-xs font-normal">
                            <ImageIcon className="h-3 w-3 mr-1 text-zinc-500" /> {photoCount} {photoCount === 1 ? "foto" : "fotos"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Sin fotos</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <DigitalBudgetModal repair={repair} />
                        {vehicle?.id && (
                          <VehicleHistoryModal vehicleId={vehicle.id} plate={vehicle.plate} brand={vehicle.brand} model={vehicle.model} />
                        )}
                        <EditRepairModal repair={repair} />
                        <DeleteRepairButton repairId={repair.id} reason={repair.reason} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
