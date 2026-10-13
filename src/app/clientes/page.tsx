import { getClients } from "@/actions/clients"
import { ClientForm } from "@/components/forms/ClientForm"
import { EditClientModal, DeleteClientButton } from "@/components/clients/ClientActions"
import { AddVehicleModal } from "@/components/vehicles/VehicleActions"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import Link from "next/link"
import { MessageCircle, Plus, Eye, Users, Car, UserCheck, AlertTriangle } from "lucide-react"

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q || "";
  const { clients, error: fetchError } = await getClients(q);

  const totalClients = clients?.length || 0;
  const clientsWithVehicles = clients?.filter((c: any) => c.vehicles && c.vehicles.length > 0).length || 0;
  const totalVehiclesCount = clients?.reduce((sum: number, c: any) => sum + (c.vehicles?.length || 0), 0) || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Gestión de Clientes</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Administra la información de tus clientes y sus vehículos registrados.</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Cliente
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Cliente</DialogTitle>
            </DialogHeader>
            <ClientForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert Box if Supabase fetch failed */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-900">Error de conexión a la base de datos (Supabase)</p>
            <p className="text-amber-700">{fetchError}</p>
            <p className="text-xs text-amber-600 pt-1">
              <strong>Tip:</strong> Revisa tu panel en <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold">Supabase Dashboard</a> para reactivar el proyecto si ha sido pausado por inactividad.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-900">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Clientes</p>
              <p className="text-2xl font-bold text-zinc-900">{totalClients}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Con Vehículos</p>
              <p className="text-2xl font-bold text-zinc-900">{clientsWithVehicles}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vehículos Registrados</p>
              <p className="text-2xl font-bold text-zinc-900">{totalVehiclesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchInput placeholder="Buscar por nombre, RUC, CI o teléfono..." />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {(!clients || clients.length === 0) ? (
          <div className="text-center py-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-500">
            <Users className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
            <p className="font-semibold text-zinc-800 text-sm">No se encontraron clientes</p>
          </div>
        ) : (
          clients.map((client: any) => {
            const vehicleCount = client.vehicles?.length || 0;
            return (
              <div key={client.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/clientes/${client.id}`} className="font-bold text-zinc-900 hover:text-blue-600 text-sm">
                      {client.name}
                    </Link>
                    <p className="font-mono text-xs text-zinc-500 mt-0.5">DOC: {client.document}</p>
                  </div>
                  {client.phone && (
                    <a
                      href={generateWhatsAppLink(client.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md active:bg-emerald-100"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </div>

                {/* Vehículos del cliente */}
                <div className="pt-2 border-t border-zinc-100">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Vehículos ({vehicleCount})</p>
                  {vehicleCount > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {client.vehicles.map((v: any) => (
                        <Badge key={v.id} variant="outline" className="font-mono text-[10px] uppercase bg-zinc-50">
                          {v.plate} ({v.brand} {v.model})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Sin vehículos asociados</span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-100 flex-wrap">
                  <AddVehicleModal clientId={client.id} clientName={client.name} buttonVariant="outline" />
                  <div className="flex items-center gap-1">
                    <Link href={`/clientes/${client.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8">
                        <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                      </Button>
                    </Link>
                    <EditClientModal client={client} />
                    <DeleteClientButton clientId={client.id} clientName={client.name} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Nombre / Cliente</TableHead>
              <TableHead className="font-semibold text-zinc-700">Documento / RUC</TableHead>
              <TableHead className="font-semibold text-zinc-700">Contacto</TableHead>
              <TableHead className="font-semibold text-zinc-700">Vehículos Registrados</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!clients || clients.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Users className="h-8 w-8 text-zinc-300" />
                    <p className="font-medium text-zinc-700">
                      {fetchError ? "Sin conexión a la base de datos" : "No se encontraron clientes"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {fetchError 
                        ? "Verifica tu conexión y el estado de tu proyecto en Supabase."
                        : "Intenta cambiar el término de búsqueda o crea un nuevo cliente."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client: any) => {
                const vehicleCount = client.vehicles?.length || 0;

                return (
                  <TableRow key={client.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <div>
                        <Link href={`/clientes/${client.id}`} className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
                          {client.name}
                        </Link>
                        {client.email && (
                          <div className="text-xs text-zinc-500 mt-0.5">{client.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-700">
                      {client.document}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-zinc-700">{client.phone}</span>
                        {client.phone && (
                          <a 
                            href={generateWhatsAppLink(client.phone)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                            title="Contactar por WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {vehicleCount > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 font-normal">
                              <Car className="h-3 w-3 mr-1 text-zinc-500" />
                              {vehicleCount} {vehicleCount === 1 ? "vehículo" : "vehículos"}
                            </Badge>
                            {client.vehicles.slice(0, 2).map((v: any) => (
                              <Badge key={v.id} variant="outline" className="font-mono text-[10px] uppercase bg-zinc-50">
                                {v.plate} ({v.brand})
                              </Badge>
                            ))}
                            {vehicleCount > 2 && (
                              <span className="text-[10px] text-zinc-400 font-medium">
                                +{vehicleCount - 2} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Sin vehículos</span>
                        )}
                        <AddVehicleModal clientId={client.id} clientName={client.name} buttonVariant="ghost" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link href={`/clientes/${client.id}`}>
                          <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                            <Eye className="mr-1 h-3.5 w-3.5" /> Perfil
                          </Button>
                        </Link>
                        <EditClientModal client={client} />
                        <DeleteClientButton clientId={client.id} clientName={client.name} />
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
