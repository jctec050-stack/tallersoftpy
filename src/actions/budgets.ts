"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface BudgetFilters {
  q?: string
  clientId?: string
  startDate?: string
  endDate?: string
  status?: string
}

export async function getBudgets(filtersOrSearch?: string | BudgetFilters) {
  const filters: BudgetFilters = typeof filtersOrSearch === "string" 
    ? { q: filtersOrSearch } 
    : filtersOrSearch || {}

  try {
    let query = supabase
      .from("repairs")
      .select("*, vehicle:vehicles(*, client:clients(*)), mechanic:mechanics(*)")
      .order("created_at", { ascending: false })

    // Filtros de fecha a nivel de base de datos
    if (filters.startDate) {
      query = query.gte("entry_date", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("entry_date", filters.endDate)
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("budget_status", filters.status)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getBudgets:", error.message)
      return { budgets: [], error: error.message }
    }

    let results = data || []

    // Filtro por cliente específico
    if (filters.clientId && filters.clientId !== "all") {
      results = results.filter((b: any) => {
        const client = b.vehicle?.client
        return client?.id === filters.clientId || b.vehicle?.client_id === filters.clientId
      })
    }

    // Filtro de búsqueda general por texto (cliente, documento, teléfono, chapa, marca, modelo, motivo, código)
    if (filters.q && filters.q.trim()) {
      const qLower = filters.q.trim().toLowerCase()
      results = results.filter((b: any) => {
        const reason = (b.reason || "").toLowerCase()
        const diagnosis = (b.diagnosis || "").toLowerCase()
        const budgetStatus = (b.budget_status || "").toLowerCase()
        const id = (b.id || "").toLowerCase()
        const presCode = `#pres-${id.slice(0, 8)}`
        const vehicle = b.vehicle
        const plate = (vehicle?.plate || "").toLowerCase()
        const brand = (vehicle?.brand || "").toLowerCase()
        const model = (vehicle?.model || "").toLowerCase()
        const client = vehicle?.client
        const clientName = (client?.name || "").toLowerCase()
        const clientDoc = (client?.document || "").toLowerCase()
        const clientPhone = (client?.phone || "").toLowerCase()

        return (
          reason.includes(qLower) ||
          diagnosis.includes(qLower) ||
          budgetStatus.includes(qLower) ||
          id.includes(qLower) ||
          presCode.includes(qLower) ||
          plate.includes(qLower) ||
          brand.includes(qLower) ||
          model.includes(qLower) ||
          clientName.includes(qLower) ||
          clientDoc.includes(qLower) ||
          clientPhone.includes(qLower)
        )
      })
    }

    return { budgets: results, error: null }
  } catch (err: unknown) {
    console.error("Fetch failed in getBudgets:", err)
    return { 
      budgets: [], 
      error: "No se pudo conectar a la tabla de presupuestos." 
    }
  }
}

export async function updateBudgetStatus(repairId: string, newStatus: "Pendiente" | "Aceptado" | "Entregado" | "Facturado") {
  try {
    const { error } = await supabase
      .from("repairs")
      .update({ budget_status: newStatus })
      .eq("id", repairId)

    if (error) throw new Error(error.message)
    revalidatePath("/facturacion")
    revalidatePath("/cobranzas")
    revalidatePath("/presupuestos")
    revalidatePath("/reparaciones")
    revalidatePath(`/reparaciones/${repairId}`)
    revalidatePath("/")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar el estado del presupuesto"
    throw new Error(message)
  }
}

export async function invoiceBudgets(repairIds: string[]) {
  try {
    if (!repairIds || repairIds.length === 0) {
      throw new Error("Debe seleccionar al menos un presupuesto para facturar.")
    }

    const { error } = await supabase
      .from("repairs")
      .update({ budget_status: "Facturado" })
      .in("id", repairIds)

    if (error) throw new Error(error.message)

    revalidatePath("/facturacion")
    revalidatePath("/cobranzas")
    revalidatePath("/presupuestos")
    revalidatePath("/reparaciones")
    revalidatePath("/")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al facturar los presupuestos seleccionados"
    throw new Error(message)
  }
}

export async function getBudgetServiceSuggestions() {
  const serviceMap = new Map<string, {
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
  }>()

  try {
    // 1. Obtener ítems presupuestados previamente de las reparaciones registradas
    const { data: repairsData, error: repairsError } = await supabase
      .from("repairs")
      .select("budget_items, created_at")
      .not("budget_items", "is", null)
      .order("created_at", { ascending: false })
      .limit(150)

    if (!repairsError && repairsData) {
      for (const row of repairsData) {
        const items = row.budget_items as any[] | null
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && item.description && item.description.trim()) {
              const cleanDesc = item.description.trim()
              const key = cleanDesc.toLowerCase()
              const existing = serviceMap.get(key)
              if (existing) {
                existing.usageCount = (existing.usageCount || 1) + 1
              } else {
                serviceMap.set(key, {
                  description: cleanDesc,
                  price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
                  quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 1,
                  source: "history",
                  usageCount: 1,
                  lastUsed: row.created_at,
                  inventory_id: item.inventory_id || null
                })
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching historical budget services:", err)
  }

  // 2. Obtener repuestos del inventario con ID real, código y stock disponible
  try {
    const { data: invData, error: invError } = await supabase
      .from("inventory")
      .select("id, code, name, sale_price, stock, category")
      .order("name", { ascending: true })
      .limit(100)

    if (!invError && invData) {
      for (const inv of invData) {
        if (inv.name && inv.name.trim()) {
          const cleanName = inv.name.trim()
          const displayName = inv.code && inv.code !== cleanName 
            ? `${cleanName} (${inv.code})` 
            : cleanName

          const key = cleanName.toLowerCase()
          // Damos prioridad al ítem real del inventario con su stock
          serviceMap.set(key, {
            description: displayName,
            price: Number(inv.sale_price) || 0,
            quantity: 1,
            category: inv.category || "Repuesto / Inventario",
            source: "inventory",
            usageCount: 2,
            inventory_id: inv.id,
            stock: Number(inv.stock) || 0,
            code: inv.code
          })
        }
      }
    }
  } catch {
    // Ignorar si la tabla inventario no está creada aún
  }

  return { services: Array.from(serviceMap.values()) }
}
