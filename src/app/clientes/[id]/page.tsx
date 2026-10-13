import { getClientById } from "@/actions/clients"
import { EditClientModal, DeleteClientButton } from "@/components/clients/ClientActions"
import { AddVehicleModal, EditVehicleModal, DeleteVehicleButton } from "@/components/vehicles/VehicleActions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { ArrowLeft, Car, MessageCircle, MapPin, Mail, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const vehicles = client.vehicles || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Navigation link */}
      <div>
        <Link href="/clientes" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver a Clientes
        </Link>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">{client.name}</h1>
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 text-xs">
                {vehicles.length} {vehicles.length === 1 ? "vehículo" : "vehículos"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Perfil del cliente y rodados asignados</p>
          </div>

          <div className="flex items-center gap-2">
            <EditClientModal client={client} />
            <DeleteClientButton clientId={client.id} clientName={client.name} />
          </div>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
            <div className="flex items-center text-zinc-500 text-xs font-medium mb-1">
              <FileText className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Documento / RUC
            </div>
            <div className="font-semibold text-zinc-900 font-mono">{client.document}</div>
          </div>

          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
            <div className="flex items-center text-zinc-500 text-xs font-medium mb-1">
              <Phone className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Teléfono de Contacto
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900">{client.phone}</span>
              {client.phone && (
                <a 
                  href={generateWhatsAppLink(client.phone)} 
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
            <div className="font-medium text-zinc-900 truncate">{client.email || "No especificado"}</div>
          </div>

          <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
            <div className="flex items-center text-zinc-500 text-xs font-medium mb-1">
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Dirección
            </div>
            <div className="font-medium text-zinc-900 truncate">{client.address || "No especificada"}</div>
          </div>
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center">
              <Car className="mr-2 h-5 w-5 text-zinc-700" /> Vehículos Asignados ({vehicles.length})
            </h2>
            <p className="text-xs text-zinc-500">Puedes agregar múltiples vehículos para un mismo cliente.</p>
          </div>
          <AddVehicleModal clientId={client.id} clientName={client.name} buttonVariant="default" />
        </div>

        {/* Mobile Cards View (md:hidden) */}
        <div className="md:hidden space-y-3">
          {vehicles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 text-zinc-500 space-y-2">
              <Car className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="font-medium text-zinc-700">Este cliente aún no tiene vehículos registrados</p>
              <p className="text-xs text-zinc-500">Haz clic en "Agregar Vehículo" para agregar el primero.</p>
            </div>
          ) : (
            vehicles.map((vehicle: any) => (
              <div key={vehicle.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold tracking-wider px-2.5 py-1">
                      {vehicle.plate}
                    </Badge>
                    <h3 className="font-bold text-zinc-900 text-base">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditVehicleModal vehicle={vehicle} clientId={client.id} />
                    <DeleteVehicleButton vehicleId={vehicle.id} plate={vehicle.plate} clientId={client.id} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Año</span>
                    <span className="font-medium text-zinc-700">{vehicle.year || "-"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Kilometraje</span>
                    <span className="font-medium text-zinc-700">{vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km</span>
                  </div>
                  {vehicle.color && (
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Color</span>
                      <span className="font-medium text-zinc-700 capitalize">🎨 {vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.vin && (
                    <div className="col-span-2">
                      <span className="text-zinc-400 block text-[10px] uppercase font-semibold">VIN / Chasis</span>
                      <span className="font-mono text-[11px] text-zinc-600 truncate block">{vehicle.vin}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-zinc-50 border-b border-zinc-200">
              <TableRow>
                <TableHead className="font-semibold text-zinc-700">Chapa / Matrícula</TableHead>
                <TableHead className="font-semibold text-zinc-700">Marca y Modelo</TableHead>
                <TableHead className="font-semibold text-zinc-700">Año</TableHead>
                <TableHead className="font-semibold text-zinc-700">Kilometraje</TableHead>
                <TableHead className="font-semibold text-zinc-700">Color / VIN</TableHead>
                <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Car className="h-8 w-8 text-zinc-300" />
                      <p className="font-medium text-zinc-700">Este cliente aún no tiene vehículos registrados</p>
                      <p className="text-xs text-zinc-500">Haz clic en "Agregar Vehículo" para agregar el primero.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle: any) => (
                  <TableRow key={vehicle.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold tracking-wider px-2.5 py-1">
                        {vehicle.plate}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900">
                      {vehicle.brand} {vehicle.model}
                    </TableCell>
                    <TableCell className="text-zinc-600">{vehicle.year}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-700">
                      {vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {vehicle.color && <span className="mr-2 capitalize">🎨 {vehicle.color}</span>}
                      {vehicle.vin && <span className="font-mono text-[11px] block text-zinc-400">VIN: {vehicle.vin}</span>}
                      {!vehicle.color && !vehicle.vin && "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <EditVehicleModal vehicle={vehicle} clientId={client.id} />
                        <DeleteVehicleButton vehicleId={vehicle.id} plate={vehicle.plate} clientId={client.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
