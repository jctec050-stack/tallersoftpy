import { getMechanicById } from "@/actions/mechanics"
import { EditMechanicModal, DeleteMechanicButton, AssignServiceModal } from "@/components/mechanics/MechanicActions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { ArrowLeft, UserCheck, Wrench, MessageCircle, Phone, Mail, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function MechanicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mechanic = await getMechanicById(id)

  if (!mechanic) {
    notFound()
  }

  const repairs = mechanic.repairs || []
  const activeRepairs = repairs.filter((r: any) => r.status !== "Completado" && r.status !== "Entregado")
  const completedRepairs = repairs.filter((r: any) => r.status === "Completado" || r.status === "Entregado")

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Back Link */}
      <div>
        <Link href="/mecanicos" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver a Mecánicos
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {mechanic.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{mechanic.name}</h1>
                {mechanic.status === "Activo" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">🟢 Activo</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">🔴 Inactivo</Badge>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-500 mt-1">🔧 {mechanic.specialty || "Mecánica General"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AssignServiceModal mechanicId={mechanic.id} mechanicName={mechanic.name} />
            <EditMechanicModal mechanic={mechanic} />
            <DeleteMechanicButton mechanicId={mechanic.id} name={mechanic.name} />
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
            <div className="flex items-center text-zinc-500 text-xs font-medium mb-1">
              <Phone className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Teléfono / WhatsApp
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900">{mechanic.phone || "No registrado"}</span>
              {mechanic.phone && (
                <a 
                  href={generateWhatsAppLink(mechanic.phone)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
            <div className="flex items-center text-zinc-500 text-xs font-medium mb-1">
              <Mail className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Correo Electrónico
            </div>
            <div className="font-medium text-zinc-900">{mechanic.email || "No registrado"}</div>
          </div>
        </div>
      </div>

      {/* Assigned Repairs Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center">
              <Wrench className="mr-2 h-5 w-5 text-zinc-700" /> Trabajos Asignados ({repairs.length})
            </h2>
            <p className="text-xs text-zinc-500">Historial de órdenes de reparación en las que participa este mecánico.</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-zinc-50 border-b border-zinc-200">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Ingreso</TableHead>
                <TableHead className="font-semibold text-zinc-700">Vehículo / Cliente</TableHead>
                <TableHead className="font-semibold text-zinc-700">Motivo</TableHead>
                <TableHead className="font-semibold text-zinc-700">Prioridad</TableHead>
                <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
                <TableHead className="font-semibold text-zinc-700 text-right">Ver Orden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Wrench className="h-8 w-8 text-zinc-300" />
                      <p className="font-medium text-zinc-700">Este mecánico no tiene trabajos asignados</p>
                      <p className="text-xs text-zinc-500">Haz clic en "Asignar Servicio" para asignarle una orden de reparación.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                repairs.map((repair: any) => {
                  const vehicle = repair.vehicle
                  const client = vehicle?.client

                  return (
                    <TableRow key={repair.id} className="hover:bg-zinc-50/80 transition-colors">
                      <TableCell>
                        <div className="flex items-center text-xs font-semibold text-zinc-700">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                          {new Date(repair.entry_date).toLocaleDateString("es-PY")}
                        </div>
                      </TableCell>

                      <TableCell>
                        {vehicle ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold">
                                {vehicle.plate}
                              </Badge>
                              <span className="font-semibold text-zinc-900 text-xs">{vehicle.brand} {vehicle.model}</span>
                            </div>
                            {client && <span className="text-xs text-zinc-500 block mt-0.5">👤 {client.name}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Sin vehículo</span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-xs font-medium text-zinc-900 text-xs truncate">
                        {repair.reason}
                      </TableCell>

                      <TableCell>
                        <Badge className={repair.priority === "Alta" ? "bg-red-100 text-red-800" : repair.priority === "Media" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
                          {repair.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-medium text-xs bg-zinc-50">
                          {repair.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/reparaciones/${repair.id}`}>
                          <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                            <Eye className="mr-1 h-3.5 w-3.5" /> Detalle
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
