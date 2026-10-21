"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  User, 
  Calendar, 
  X, 
  Filter, 
  RotateCcw 
} from "lucide-react"

interface ClientOption {
  id: string
  name: string
  document?: string
}

interface BudgetFiltersBarProps {
  clients: ClientOption[]
}

export function BudgetFiltersBar({ clients }: BudgetFiltersBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Valores locales sincronizados con URL
  const [q, setQ] = useState(searchParams.get("q") || "")
  const [selectedClient, setSelectedClient] = useState(searchParams.get("client") || "")
  const [fromDate, setFromDate] = useState(searchParams.get("from") || "")
  const [toDate, setToDate] = useState(searchParams.get("to") || "")

  // Sincronizar si cambia externamente
  useEffect(() => {
    setQ(searchParams.get("q") || "")
    setSelectedClient(searchParams.get("client") || "")
    setFromDate(searchParams.get("from") || "")
    setToDate(searchParams.get("to") || "")
  }, [searchParams])

  // Aplicar filtros en URL
  const updateFilters = (newParams: { q?: string; client?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams(searchParams.toString())

    const merged = {
      q: newParams.q !== undefined ? newParams.q : q,
      client: newParams.client !== undefined ? newParams.client : selectedClient,
      from: newParams.from !== undefined ? newParams.from : fromDate,
      to: newParams.to !== undefined ? newParams.to : toDate,
    }

    if (merged.q?.trim()) params.set("q", merged.q.trim())
    else params.delete("q")

    if (merged.client && merged.client !== "all") params.set("client", merged.client)
    else params.delete("client")

    if (merged.from) params.set("from", merged.from)
    else params.delete("from")

    if (merged.to) params.set("to", merged.to)
    else params.delete("to")

    // Al cambiar cualquier filtro, volver a la página 1
    params.delete("page")

    startTransition(() => {
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname)
    })
  }

  const handleClearFilters = () => {
    setQ("")
    setSelectedClient("")
    setFromDate("")
    setToDate("")

    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    params.delete("client")
    params.delete("from")
    params.delete("to")
    params.delete("page")

    startTransition(() => {
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname)
    })
  }

  const hasActiveFilters = !!(q || (selectedClient && selectedClient !== "all") || fromDate || toDate)

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span>Filtros de Presupuestos</span>
          {hasActiveFilters && (
            <span className="bg-zinc-900 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              Activos
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 px-2"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
        {/* 1. Búsqueda por texto (Cliente, chapa, motivo) */}
        <div className="sm:col-span-4 space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500">
            Búsqueda General
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cliente, chapa, motivo..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                updateFilters({ q: e.target.value })
              }}
              className="pl-8 pr-7 h-9 text-xs bg-zinc-50/50 border-zinc-200 focus-visible:bg-white"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("")
                  updateFilters({ q: "" })
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Filtro desplegable por Cliente */}
        <div className="sm:col-span-3 space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 flex items-center gap-1">
            <User className="h-3 w-3 text-zinc-400" />
            Cliente
          </label>
          <select
            value={selectedClient}
            onChange={(e) => {
              setSelectedClient(e.target.value)
              updateFilters({ client: e.target.value })
            }}
            className="w-full h-9 rounded-md border border-zinc-200 bg-zinc-50/50 px-2.5 py-1 text-xs text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
          >
            <option value="">-- Todos los clientes --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.document ? `(${c.document})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filtros Fecha Desde y Hasta agrupados */}
        <div className="grid grid-cols-2 gap-2 sm:col-span-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-400" />
              Desde
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                updateFilters({ from: e.target.value })
              }}
              className="h-9 text-xs bg-zinc-50/50 border-zinc-200 focus-visible:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-400" />
              Hasta
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                updateFilters({ to: e.target.value })
              }}
              className="h-9 text-xs bg-zinc-50/50 border-zinc-200 focus-visible:bg-white"
            />
          </div>
        </div>

        {/* Indicador de carga sutil si hay transición pendiente */}
        <div className="sm:col-span-1 flex items-center justify-end pb-1.5 sm:pb-2">
          {isPending && (
            <span className="text-[10px] text-zinc-400 font-medium animate-pulse">
              Filtrando...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
