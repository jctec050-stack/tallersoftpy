import { getVehicles } from "@/actions/vehicles"
import { AddVehicleModal, EditVehicleModal, DeleteVehicleButton } from "@/components/vehicles/VehicleActions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import Link from "next/link"
import { Eye, AlertTriangle } from "lucide-react"

export default async function VehiculosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q || "";
  const { vehicles, error: fetchError } = await getVehicles(q);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestión de Vehículos</h1>
          <p className="text-sm text-zinc-500">Búsqueda global y administración de rodados del taller.</p>
        </div>
        <AddVehicleModal buttonText="Registrar Nuevo Vehículo" />
      </div>

      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Error de conexión a Supabase</p>
            <p className="text-amber-700">{fetchError}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <SearchInput placeholder="Buscar por chapa, marca o modelo..." />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Chapa</TableHead>
              <TableHead className="font-semibold text-zinc-700">Vehículo</TableHead>
              <TableHead className="font-semibold text-zinc-700">Propietario / Cliente</TableHead>
              <TableHead className="font-semibold text-zinc-700">Kilometraje</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!vehicles || vehicles.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  {fetchError ? "Sin conexión a la base de datos" : "No se encontraron vehículos."}
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
                    {vehicle.brand} {vehicle.model} <span className="text-zinc-500 font-normal text-xs ml-1">({vehicle.year})</span>
                  </TableCell>
                  <TableCell>
                    {vehicle.client_id ? (
                      <Link href={`/clientes/${vehicle.client_id}`} className="text-zinc-900 font-medium hover:text-blue-600 transition-colors">
                        {vehicle.client?.name || "Ver cliente"}
                      </Link>
                    ) : (
                      <span className="text-zinc-400 font-normal text-xs">Sin cliente</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-700">
                    {vehicle.mileage ? vehicle.mileage.toLocaleString() : 0} km
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {vehicle.client_id && (
                        <Link href={`/clientes/${vehicle.client_id}`}>
                          <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                            <Eye className="mr-1 h-3.5 w-3.5" /> Ver Cliente
                          </Button>
                        </Link>
                      )}
                      <EditVehicleModal vehicle={vehicle} clientId={vehicle.client_id} />
                      <DeleteVehicleButton vehicleId={vehicle.id} plate={vehicle.plate} clientId={vehicle.client_id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
