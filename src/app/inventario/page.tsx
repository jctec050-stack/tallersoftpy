import { getInventoryItems } from "@/actions/inventory"
import { InventoryForm } from "@/components/forms/InventoryForm"
import { EditInventoryModal, DeleteInventoryButton, AdjustStockModal } from "@/components/inventory/InventoryActions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchInput } from "@/components/ui/search-input"
import { Package, Plus, AlertTriangle, Boxes, DollarSign, AlertCircle, MapPin, Tag } from "lucide-react"

export default async function InventarioPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const { items, error: fetchError } = await getInventoryItems(q)

  const totalItems = items?.length || 0
  const lowStockCount = items?.filter((item: any) => item.stock <= (item.min_stock || 3)).length || 0
  const totalInventoryValue = items?.reduce((sum: number, item: any) => sum + ((item.stock || 0) * (item.sale_price || 0)), 0) || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventario de Repuestos</h1>
          <p className="text-sm text-zinc-500">Administra el catálogo de repuestos disponibles para venta y servicios del taller.</p>
        </div>

        <Dialog>
          <DialogTrigger render={<Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Repuesto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Registrar Repuesto en Inventario</DialogTitle>
            </DialogHeader>
            <InventoryForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Database Error or Setup Notice */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-amber-900">Aviso sobre la tabla 'inventory' en Supabase</p>
            <p className="text-amber-700 text-xs">{fetchError}</p>
            <details className="text-xs bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 text-amber-950 font-mono">
              <summary className="font-semibold cursor-pointer text-amber-900 mb-1 font-sans">
                👉 Haz clic para ver el comando SQL para crear la tabla de inventario en Supabase
              </summary>
              <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto pt-2">
{`CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  brand TEXT,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  cost_price NUMERIC(12,2) DEFAULT 0,
  sale_price NUMERIC(12,2) DEFAULT 0,
  location TEXT
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo acceso a inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);`}
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Repuestos</p>
              <p className="text-2xl font-bold text-zinc-900">{totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Valor del Inventario</p>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalInventoryValue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-xs">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock Bajo (Reposición)</p>
              <p className="text-2xl font-bold text-zinc-900">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchInput placeholder="Buscar por código SKU, descripción, marca o categoría..." />
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50 border-b border-zinc-200">
            <TableRow>
              <TableHead className="font-semibold text-zinc-700">Código / SKU</TableHead>
              <TableHead className="font-semibold text-zinc-700">Descripción / Repuesto</TableHead>
              <TableHead className="font-semibold text-zinc-700">Categoría</TableHead>
              <TableHead className="font-semibold text-zinc-700">Stock Disponible</TableHead>
              <TableHead className="font-semibold text-zinc-700">Precio Venta (₲)</TableHead>
              <TableHead className="font-semibold text-zinc-700">Ubicación</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!items || items.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Package className="h-8 w-8 text-zinc-300" />
                    <p className="font-medium text-zinc-700">
                      {fetchError ? "Sin conexión o tabla pendiente" : "No hay repuestos registrados en el inventario"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Haz clic en "Registrar Nuevo Repuesto" para agregar un producto al catálogo.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: any) => {
                const isLowStock = item.stock <= (item.min_stock || 3)

                return (
                  <TableRow key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase bg-zinc-100 font-bold tracking-wider">
                        {item.code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="font-semibold text-zinc-900 text-xs">{item.name}</span>
                        {item.brand && (
                          <span className="text-xs text-zinc-400 block mt-0.5">Marca: {item.brand}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 font-medium text-xs">
                        <Tag className="h-3 w-3 mr-1 text-zinc-400" /> {item.category || "General"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isLowStock ? (
                          <Badge className="bg-red-100 text-red-800 border-red-200 font-bold">
                            ⚠️ {item.stock} un. (Stock Bajo)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                            🟢 {item.stock} un.
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-bold text-zinc-900 text-xs font-mono">
                      {formatCurrency(item.sale_price)}
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500">
                      {item.location ? (
                        <span className="flex items-center gap-1 text-zinc-700">
                          <MapPin className="h-3 w-3 text-zinc-400" /> {item.location}
                        </span>
                      ) : "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <AdjustStockModal itemId={item.id} name={item.name} currentStock={item.stock} />
                        <EditInventoryModal item={item} />
                        <DeleteInventoryButton itemId={item.id} name={item.name} />
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
