import { getRepairById } from "@/actions/repairs"
import { EditRepairModal, DeleteRepairButton } from "@/components/repairs/RepairActions"
import { DigitalBudgetModal } from "@/components/repairs/DigitalBudgetModal"
import { VehicleHistoryModal } from "@/components/repairs/VehicleHistoryModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, Car, Wrench, Image as ImageIcon, FileText, User, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repair = await getRepairById(id)

  if (!repair) {
    notFound()
  }

  const vehicle = repair.vehicle
  const client = vehicle?.client
  const photos = repair.photos || []
  const items = repair.budget_items || []
  const totalBudget = repair.budget_total || items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/reparaciones" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver a Reparaciones
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900">Orden de Reparación</h1>
              <Badge variant="outline" className="font-mono text-xs">#REP-{repair.id.slice(0, 8)}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Fecha Ingreso: {new Date(repair.entry_date).toLocaleDateString("es-PY")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DigitalBudgetModal repair={repair} />
            <EditRepairModal repair={repair} />
            <DeleteRepairButton repairId={repair.id} reason={repair.reason} />
          </div>
        </div>

        {/* Priority and Status Badges */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-medium text-zinc-500">Prioridad:</span>
          <Badge className={repair.priority === "Alta" ? "bg-red-100 text-red-800" : repair.priority === "Media" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
            {repair.priority} Prioridad
          </Badge>
          <span className="text-xs font-medium text-zinc-500 ml-4">Estado:</span>
          <Badge variant="outline" className="bg-zinc-100 text-zinc-800 font-semibold">
            {repair.status}
          </Badge>
        </div>
      </div>

      {/* Vehicle and Client Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="h-4 w-4 text-zinc-500" /> Vehículo Ingresado
            </h3>
            {vehicle ? (
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm uppercase bg-zinc-100 font-bold">
                    {vehicle.plate}
                  </Badge>
                  <span className="font-bold text-zinc-900">{vehicle.brand} {vehicle.model}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Año: {vehicle.year} | Km: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km</p>
                {vehicle.id && (
                  <div className="mt-3">
                    <VehicleHistoryModal vehicleId={vehicle.id} plate={vehicle.plate} brand={vehicle.brand} model={vehicle.model} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Sin vehículo asociado</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4 text-zinc-500" /> Cliente / Propietario
            </h3>
            {client ? (
              <div>
                <Link href={`/clientes/${client.id}`} className="font-bold text-zinc-900 hover:text-blue-600 transition-colors">
                  {client.name}
                </Link>
                <p className="text-xs text-zinc-500 mt-0.5">RUC/CI: {client.document}</p>
                <p className="text-xs text-zinc-500">Tel: {client.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Sin datos de cliente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Motivo & Diagnóstico */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-zinc-500" /> Motivo y Diagnóstico Técnico
        </h3>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Motivo de Ingreso / Falla Reportada</p>
          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100 text-sm text-zinc-800">
            {repair.reason}
          </div>
        </div>

        {repair.diagnosis && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Diagnóstico Técnico</p>
            <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100 text-sm text-zinc-800 whitespace-pre-wrap">
              {repair.diagnosis}
            </div>
          </div>
        )}
      </div>

      {/* Fotos Antes de Reparar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-zinc-500" /> Fotos Antes de Reparar ({photos.length})
        </h3>

        {photos.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-4 text-center">No hay fotografías registradas para esta orden.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((url: string, index: number) => (
              <a key={index} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 hover:opacity-90 transition-opacity">
                <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Presupuesto Digital */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" /> Presupuesto Digital
          </h3>
          <Badge variant="outline" className="font-semibold text-xs">
            Estado: {repair.budget_status || "Borrador"}
          </Badge>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-4 text-center">Aún no se han agregado ítems al presupuesto de esta orden.</p>
        ) : (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border border-zinc-200 rounded-lg overflow-hidden">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold">
                <tr>
                  <th className="p-2.5">Descripción</th>
                  <th className="p-2.5 text-center">Cant.</th>
                  <th className="p-2.5 text-right">Precio Unitario</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium text-zinc-900">{item.description}</td>
                    <td className="p-2.5 text-center text-zinc-600">{item.quantity}</td>
                    <td className="p-2.5 text-right text-zinc-600">{formatCurrency(item.price)}</td>
                    <td className="p-2.5 text-right font-semibold text-zinc-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-900 text-white font-bold">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-xs">Total del Presupuesto:</td>
                  <td className="p-3 text-right text-sm text-emerald-400">{formatCurrency(totalBudget)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
