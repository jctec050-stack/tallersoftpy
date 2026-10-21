export interface CachedBudgetService {
  description: string
  price: number
  quantity: number
  category?: string
  source: "history" | "inventory" | "preset"
  usageCount?: number
  lastUsed?: string
  inventory_id?: string | null
  stock?: number
  code?: string
}

export const WORKSHOP_SERVICE_PRESETS: CachedBudgetService[] = [
  {
    description: "Mantenimiento preventivo general (Filtros y fluidos)",
    price: 250000,
    quantity: 1,
    category: "Mantenimiento",
    source: "preset",
    usageCount: 10
  },
  {
    description: "Mantenimiento mayor (Filtros, bujías y fluidos)",
    price: 550000,
    quantity: 1,
    category: "Mantenimiento",
    source: "preset",
    usageCount: 8
  },
  {
    description: "Cambio de aceite de motor y filtro de aceite",
    price: 220000,
    quantity: 1,
    category: "Mantenimiento",
    source: "preset",
    usageCount: 15
  },
  {
    description: "Cambio de pastillas de freno delanteras",
    price: 180000,
    quantity: 1,
    category: "Frenos",
    source: "preset",
    usageCount: 12
  },
  {
    description: "Cambio de pastillas de freno traseras",
    price: 160000,
    quantity: 1,
    category: "Frenos",
    source: "preset",
    usageCount: 9
  },
  {
    description: "Rectificación de discos de freno (Par)",
    price: 150000,
    quantity: 1,
    category: "Frenos",
    source: "preset",
    usageCount: 6
  },
  {
    description: "Alineación y balanceo computarizado (4 ruedas)",
    price: 120000,
    quantity: 1,
    category: "Tren Delantero",
    source: "preset",
    usageCount: 11
  },
  {
    description: "Limpieza y calibración de inyectores por ultrasonido",
    price: 200000,
    quantity: 1,
    category: "Inyección",
    source: "preset",
    usageCount: 7
  },
  {
    description: "Escaneo computarizado y diagnóstico de fallas",
    price: 100000,
    quantity: 1,
    category: "Diagnóstico",
    source: "preset",
    usageCount: 14
  },
  {
    description: "Carga de gas aire acondicionado y control de fugas",
    price: 180000,
    quantity: 1,
    category: "Aire Acondicionado",
    source: "preset",
    usageCount: 5
  },
  {
    description: "Cambio de filtro de aire de motor",
    price: 65000,
    quantity: 1,
    category: "Mantenimiento",
    source: "preset",
    usageCount: 6
  },
  {
    description: "Cambio de filtro de combustible / nafta",
    price: 85000,
    quantity: 1,
    category: "Mantenimiento",
    source: "preset",
    usageCount: 5
  },
  {
    description: "Cambio de filtro de cabina / antipolen",
    price: 75000,
    quantity: 1,
    category: "Aire Acondicionado",
    source: "preset",
    usageCount: 4
  },
  {
    description: "Cambio de líquido de freno y purga del sistema",
    price: 90000,
    quantity: 1,
    category: "Frenos",
    source: "preset",
    usageCount: 4
  },
  {
    description: "Cambio de kit de correa dentada / distribución",
    price: 450000,
    quantity: 1,
    category: "Motor",
    source: "preset",
    usageCount: 3
  },
  {
    description: "Mano de obra general de taller",
    price: 150000,
    quantity: 1,
    category: "Mano de Obra",
    source: "preset",
    usageCount: 10
  }
]

const LOCAL_STORAGE_KEY = "tallersoft_cached_budget_services"

export function getLocalCachedServices(): CachedBudgetService[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error("Error reading cached budget services from localStorage:", err)
    return []
  }
}

export function saveLocalCachedService(item: {
  description: string
  price: number
  quantity?: number
  category?: string
  inventory_id?: string | null
  stock?: number
  code?: string
}): CachedBudgetService[] {
  if (typeof window === "undefined" || !item.description?.trim()) return []
  try {
    const cleanDesc = item.description.trim()
    const current = getLocalCachedServices()
    const index = current.findIndex(
      (s) => s.description.trim().toLowerCase() === cleanDesc.toLowerCase()
    )

    const updatedService: CachedBudgetService = {
      description: cleanDesc,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      category: item.category,
      source: item.inventory_id ? "inventory" : "history",
      inventory_id: item.inventory_id || null,
      stock: item.stock,
      code: item.code,
      usageCount: index >= 0 ? (current[index].usageCount || 1) + 1 : 1,
      lastUsed: new Date().toISOString()
    }

    let updatedList: CachedBudgetService[]
    if (index >= 0) {
      updatedList = [...current]
      updatedList[index] = updatedService
    } else {
      updatedList = [updatedService, ...current]
    }

    // Keep up to 200 items in cache
    const trimmed = updatedList.slice(0, 200)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed))
    return trimmed
  } catch (err) {
    console.error("Error saving cached budget service to localStorage:", err)
    return getLocalCachedServices()
  }
}

export function removeLocalCachedService(description: string): CachedBudgetService[] {
  if (typeof window === "undefined") return []
  try {
    const current = getLocalCachedServices()
    const filtered = current.filter(
      (s) => s.description.trim().toLowerCase() !== description.trim().toLowerCase()
    )
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (err) {
    console.error("Error removing cached budget service from localStorage:", err)
    return getLocalCachedServices()
  }
}

export function mergeServiceSources(
  localList: CachedBudgetService[],
  remoteList: CachedBudgetService[],
  presets: CachedBudgetService[] = WORKSHOP_SERVICE_PRESETS
): CachedBudgetService[] {
  const map = new Map<string, CachedBudgetService>()

  // 1. Add presets first (lowest priority)
  for (const item of presets) {
    const key = item.description.trim().toLowerCase()
    map.set(key, { ...item })
  }

  // 2. Add remote database items (higher priority, overrides preset)
  for (const item of remoteList) {
    const key = item.description.trim().toLowerCase()
    const existing = map.get(key)
    map.set(key, {
      ...item,
      usageCount: (existing?.usageCount || 0) + (item.usageCount || 1)
    })
  }

  // 3. Add local items (highest priority, represents latest user inputs on this device)
  for (const item of localList) {
    const key = item.description.trim().toLowerCase()
    const existing = map.get(key)
    map.set(key, {
      ...item,
      usageCount: Math.max(existing?.usageCount || 1, item.usageCount || 1),
      source: "history"
    })
  }

  return Array.from(map.values()).sort((a, b) => {
    // History first, then inventory, then preset
    const sourcePriority = { history: 3, inventory: 2, preset: 1 }
    const pA = sourcePriority[a.source] || 1
    const pB = sourcePriority[b.source] || 1
    if (pA !== pB) return pB - pA

    // Then by usageCount
    const countA = a.usageCount || 0
    const countB = b.usageCount || 0
    if (countA !== countB) return countB - countA

    // Then alphabetical
    return a.description.localeCompare(b.description)
  })
}
