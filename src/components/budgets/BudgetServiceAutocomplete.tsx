"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  History, 
  Package, 
  Wrench, 
  X, 
  CornerDownLeft, 
  Plus, 
  Trash2,
  Check
} from "lucide-react"
import { 
  CachedBudgetService, 
  getLocalCachedServices, 
  removeLocalCachedService, 
  mergeServiceSources, 
  WORKSHOP_SERVICE_PRESETS 
} from "@/lib/budget-cache"
import { getBudgetServiceSuggestions } from "@/actions/budgets"

interface BudgetServiceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectService: (service: {
    description: string
    price: number
    quantity: number
    inventory_id?: string | null
    stock?: number
  }) => void
  onAddDirectly?: (service: {
    description: string
    price: number
    quantity: number
    inventory_id?: string | null
    stock?: number
  }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function BudgetServiceAutocomplete({
  value,
  onChange,
  onSelectService,
  onAddDirectly,
  placeholder = "Descripción del servicio o repuesto...",
  className = "",
  disabled = false
}: BudgetServiceAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [allServices, setAllServices] = useState<CachedBudgetService[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Cargar servicios: primero local/presets (inmediato) y luego de la base de datos
  useEffect(() => {
    const local = getLocalCachedServices()
    const initial = mergeServiceSources(local, [], WORKSHOP_SERVICE_PRESETS)
    setAllServices(initial)

    // Cargar historial remoto de reparaciones e inventario
    getBudgetServiceSuggestions()
      .then((res) => {
        if (res.services && res.services.length > 0) {
          const freshLocal = getLocalCachedServices()
          const merged = mergeServiceSources(freshLocal, res.services, WORKSHOP_SERVICE_PRESETS)
          setAllServices(merged)
        }
      })
      .catch((err) => {
        console.error("Error al obtener sugerencias de servicios:", err)
      })
  }, [])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Normalizar texto para búsqueda sin tildes ni mayúsculas
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  // Filtrar sugerencias
  const query = normalize(value || "")
  const filteredSuggestions = useMemo(() => {
    if (!query) {
      // Si está vacío, mostrar los más frecuentes / recientes (máximo 6)
      return allServices.slice(0, 6)
    }

    const words = query.split(/\s+/).filter(Boolean)
    return allServices
      .filter((service) => {
        const target = normalize(service.description + " " + (service.category || ""))
        return words.every((word) => target.includes(word))
      })
      .slice(0, 8)
  }, [allServices, query])

  // Reset del selectedIndex al cambiar el filtro
  useEffect(() => {
    setSelectedIndex(-1)
  }, [filteredSuggestions.length, query])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSelect = (service: CachedBudgetService) => {
    onSelectService({
      description: service.description,
      price: service.price,
      quantity: service.quantity || 1,
      inventory_id: service.inventory_id || null,
      stock: service.stock
    })
    setIsOpen(false)
    if (service.inventory_id) {
      setFeedbackMsg(`📦 Repuesto de inventario: ${service.description} (Stock: ${service.stock ?? 0} un.)`)
    } else {
      setFeedbackMsg(`Sugerido: ${service.description} (${formatCurrency(service.price)})`)
    }
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleQuickAdd = (e: React.MouseEvent, service: CachedBudgetService) => {
    e.stopPropagation()
    if (onAddDirectly) {
      onAddDirectly({
        description: service.description,
        price: service.price,
        quantity: service.quantity || 1,
        inventory_id: service.inventory_id || null,
        stock: service.stock
      })
      setIsOpen(false)
      setFeedbackMsg(`¡Agregado!: ${service.description}`)
      setTimeout(() => setFeedbackMsg(null), 3000)
    } else {
      handleSelect(service)
    }
  }

  const handleDeleteCachedItem = (e: React.MouseEvent, desc: string) => {
    e.stopPropagation()
    const updated = removeLocalCachedService(desc)
    setAllServices((prev) => prev.filter((s) => s.description.toLowerCase() !== desc.toLowerCase()))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        e.preventDefault()
        handleSelect(filteredSuggestions[selectedIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Scroll automático en lista al usar flechas
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.children
      if (items[selectedIndex]) {
        (items[selectedIndex] as HTMLElement).scrollIntoView({
          block: "nearest"
        })
      }
    }
  }, [selectedIndex])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Campo de búsqueda con icono y botón de limpiar */}
      <div className="relative flex items-center">
        <Sparkles className="absolute left-2.5 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`h-9 pl-8 pr-8 text-xs bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 ${className}`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              inputRef.current?.focus()
            }}
            className="absolute right-2.5 p-0.5 text-zinc-400 hover:text-zinc-600 rounded-full"
            title="Limpiar texto"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Mensaje de feedback de autocompletado */}
      {feedbackMsg && (
        <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-in fade-in slide-in-from-top-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Check className="h-3 w-3 shrink-0" />
            <span className="truncate">{feedbackMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-normal shrink-0 hidden sm:inline">
            Puedes editar precio o cantidad
          </span>
        </div>
      )}

      {/* Menú desplegable de sugerencias predictivas */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10 animate-in fade-in zoom-in-95 w-full max-w-full">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-500 border-b border-zinc-100 gap-2">
            <span className="flex items-center gap-1 min-w-0 truncate">
              <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">{query ? `Predicciones para "${value}"` : "Servicios frecuentes & presupuestados"}</span>
            </span>
            <span className="text-[10px] font-normal text-zinc-400 shrink-0 hidden sm:inline">
              Usa ↑ ↓ y Enter
            </span>
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-500">
              No se encontraron coincidencias. Se guardará en caché al agregar el ítem.
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-zinc-50 pt-0.5">
              {filteredSuggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <li
                    key={item.description + idx}
                    onClick={() => handleSelect(item)}
                    className={`group flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? "bg-zinc-900 text-white"
                        : "hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {item.source === "history" ? (
                          <History className={`h-3.5 w-3.5 ${isSelected ? "text-emerald-300" : "text-emerald-600"}`} />
                        ) : item.source === "inventory" ? (
                          <Package className={`h-3.5 w-3.5 ${isSelected ? "text-blue-300" : "text-blue-600"}`} />
                        ) : (
                          <Wrench className={`h-3.5 w-3.5 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium truncate">{item.description}</span>
                          {item.source === "history" && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                isSelected
                                  ? "bg-emerald-950 text-emerald-200 border border-emerald-800"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              Presupuestado {item.usageCount && item.usageCount > 1 ? `(${item.usageCount}x)` : ""}
                            </span>
                          )}
                          {item.source === "inventory" && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                isSelected
                                  ? "bg-blue-950 text-blue-200 border border-blue-800"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              Repuesto
                            </span>
                          )}
                          {item.source === "inventory" && item.stock !== undefined && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                item.stock > 0
                                  ? isSelected
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isSelected
                                  ? "bg-red-950 text-red-300 border border-red-800"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {item.stock > 0 ? `Stock: ${item.stock} un.` : "Sin stock"}
                            </span>
                          )}
                        </div>
                        {item.category && (
                          <span className={`text-[10px] block ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className={`font-mono font-bold text-xs ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                          {formatCurrency(item.price)}
                        </div>
                        <div className={`text-[10px] ${isSelected ? "text-zinc-400" : "text-zinc-500"}`}>
                          Cant: {item.quantity || 1}
                        </div>
                      </div>

                      {/* Botón rápido para agregar directo */}
                      {onAddDirectly && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, item)}
                          className={`p-1.5 rounded transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : "bg-zinc-200 text-zinc-700 hover:bg-emerald-600 hover:text-white"
                          }`}
                          title="Agregar directamente al presupuesto con esta cantidad y precio"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}

                      {/* Botón para borrar de la caché local */}
                      {item.source === "history" && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCachedItem(e, item.description)}
                          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            isSelected ? "text-zinc-400 hover:text-red-300" : "text-zinc-400 hover:text-red-600"
                          }`}
                          title="Eliminar del historial de sugerencias"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Barra de atajo rápido al fondo */}
          <div className="mt-1 flex items-center justify-between border-t border-zinc-100 p-1.5 text-[10px] text-zinc-400 bg-zinc-50/50 rounded-b-md">
            <span>Haz clic para cargar y luego modifica si necesitas</span>
            <span className="flex items-center gap-0.5 font-medium text-zinc-600">
              <CornerDownLeft className="h-2.5 w-2.5" /> Seleccionar
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
