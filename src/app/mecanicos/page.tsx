import { getMechanics } from "@/actions/mechanics"
import { MechanicForm } from "@/components/forms/MechanicForm"
import { EditMechanicModal, DeleteMechanicButton, AssignServiceModal } from "@/components/mechanics/MechanicActions"
import { generateWhatsAppLink } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import Link from "next/link"
import { UserCheck, Plus, Eye, Wrench, MessageCircle, AlertTriangle, ShieldCheck, Phone, Mail } from "lucide-react"

export default async function MecanicosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const { mechanics, error: fetchError } = await getMechanics(q)

  const totalMechanics = mechanics?.length || 0
  const activeMechanics = mechanics?.filter((m: any) => m.status === "Activo").length || 0
  const totalAssignedRepairs = mechanics?.reduce((sum: number, m: any) => {
    const activeJobs = m.repairs?.filter((r: any) => r.status !== "Completado" && r.status !== "Entregado").length || 0
    return sum + activeJobs
  }, 0) || 0

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestión de Mecánicos</h1>
          <p className="text-sm text-zinc-500">Administra el equipo técnico y asigna trabajos de reparación de forma rápida.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Mecánico
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Perfil de Mecánico</DialogTitle>
            </DialogHeader>
            <MechanicForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Database Error or Setup Notice */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-amber-900">Aviso sobre la tabla 'mechanics' en Supabase</p>
            <p className="text-amber-700 text-xs">{fetchError}</p>
            <details className="text-xs bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 text-amber-950 font-mono">
              <summary className="font-semibold cursor-pointer text-amber-900 mb-1 font-sans">
                👉 Haz clic para ver el comando SQL para crear la tabla de mecánicos en Supabase
              </summary>
              <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto pt-2">
{`CREATE TABLE IF NOT EXISTS mechanics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  specialty TEXT DEFAULT 'Mecánica General',
  phone TEXT,
  email TEXT,
  status VARCHAR(20) DEFAULT 'Activo'
);

ALTER TABLE repairs ADD COLUMN IF NOT EXISTS mechanic_id UUID REFERENCES mechanics(id) ON DELETE SET NULL;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo acceso a mechanics" ON mechanics FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-900">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Mecánicos</p>
              <p className="text-2xl font-bold text-zinc-900">{totalMechanics}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mecánicos Activos</p>
              <p className="text-2xl font-bold text-zinc-900">{activeMechanics}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Servicios en Curso</p>
              <p className="text-2xl font-bold text-zinc-900">{totalAssignedRepairs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchInput placeholder="Buscar por nombre, especialidad o teléfono..." />
      </div>

      {/* Mechanics Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Mecánico</TableHead>
              <TableHead className="font-semibold text-zinc-700">Especialidad Principal</TableHead>
              <TableHead className="font-semibold text-zinc-700">Contacto</TableHead>
              <TableHead className="font-semibold text-zinc-700">Estado</TableHead>
              <TableHead className="font-semibold text-zinc-700">Trabajos Activos</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!mechanics || mechanics.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserCheck className="h-8 w-8 text-zinc-300" />
                    <p className="font-medium text-zinc-700">
                      {fetchError ? "Sin conexión o tabla pendiente" : "No hay mecánicos registrados"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Haz clic en "Registrar Nuevo Mecánico" para crear el primer perfil técnico.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              mechanics.map((m: any) => {
                const activeJobsCount = m.repairs?.filter((r: any) => r.status !== "Completado" && r.status !== "Entregado").length || 0

                return (
                  <TableRow key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                          {m.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/mecanicos/${m.id}`} className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
                            {m.name}
                          </Link>
                          {m.email && <div className="text-xs text-zinc-400">{m.email}</div>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 font-medium">
                        🔧 {m.specialty || "Mecánica General"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-zinc-700">{m.phone || "S/T"}</span>
                        {m.phone && (
                          <a 
                            href={generateWhatsAppLink(m.phone)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {m.status === "Activo" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">🟢 Activo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">🔴 Inactivo</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={activeJobsCount > 0 ? "bg-blue-50 text-blue-700 border-blue-200 font-bold" : "text-zinc-400 border-zinc-200 font-normal"}>
                        <Wrench className="h-3 w-3 mr-1 text-zinc-500" />
                        {activeJobsCount} {activeJobsCount === 1 ? "trabajo" : "trabajos"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <AssignServiceModal mechanicId={m.id} mechanicName={m.name} />
                        <Link href={`/mecanicos/${m.id}`}>
                          <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                            <Eye className="mr-1 h-3.5 w-3.5" /> Trabajos
                          </Button>
                        </Link>
                        <EditMechanicModal mechanic={m} />
                        <DeleteMechanicButton mechanicId={m.id} name={m.name} />
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
