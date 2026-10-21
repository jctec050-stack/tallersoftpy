"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface InventoryItemData {
  id?: string
  code: string
  name: string
  category?: string
  brand?: string
  stock: number
  min_stock: number
  cost_price: number
  sale_price: number
  location?: string
}

export async function getInventoryItems(search?: string) {
  try {
    let query = supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true })

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,category.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getInventoryItems:", error.message)
      return { items: [], error: error.message }
    }
    return { items: data || [], error: null }
  } catch (err: any) {
    console.error("Fetch failed in getInventoryItems:", err)
    return { 
      items: [], 
      error: "No se pudo conectar a la tabla 'inventory' en Supabase. Si aún no ha sido creada, ejecuta la instrucción SQL de creación." 
    }
  }
}

export async function getInventoryItemById(id: string) {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error getInventoryItemById:", error.message)
      return null
    }
    return data
  } catch (err: any) {
    console.error("Fetch failed in getInventoryItemById:", err)
    return null
  }
}

export async function createInventoryItem(data: InventoryItemData) {
  const { error } = await supabase.from("inventory").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/inventario")
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItemData>) {
  const { error } = await supabase.from("inventory").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/inventario")
}

export async function adjustInventoryStock(id: string, newStock: number) {
  const { error } = await supabase.from("inventory").update({ stock: newStock }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/inventario")
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from("inventory").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/inventario")
}

export async function syncInventoryStockForBudgetItems(
  newItems: Array<{ inventory_id?: string | null; quantity: number }>,
  previousItems?: Array<{ inventory_id?: string | null; quantity: number }>
) {
  try {
    const netDeltas = new Map<string, number>()

    // Restar el uso anterior (si se reduce la cantidad o se elimina, se devuelve al stock)
    if (previousItems && Array.isArray(previousItems)) {
      for (const item of previousItems) {
        if (item.inventory_id) {
          const current = netDeltas.get(item.inventory_id) || 0
          netDeltas.set(item.inventory_id, current - (Number(item.quantity) || 0))
        }
      }
    }

    // Sumar el nuevo uso
    if (newItems && Array.isArray(newItems)) {
      for (const item of newItems) {
        if (item.inventory_id) {
          const current = netDeltas.get(item.inventory_id) || 0
          netDeltas.set(item.inventory_id, current + (Number(item.quantity) || 0))
        }
      }
    }

    // Aplicar cada cambio neto a la base de datos
    for (const [inventoryId, delta] of netDeltas.entries()) {
      if (delta === 0) continue

      const { data: invItem, error: fetchErr } = await supabase
        .from("inventory")
        .select("id, stock")
        .eq("id", inventoryId)
        .maybeSingle()

      if (!fetchErr && invItem) {
        const currentStock = Number(invItem.stock) || 0
        // delta > 0: se consumen repuestos -> currentStock - delta
        // delta < 0: se cancelan o reducen repuestos -> se devuelven al stock
        const updatedStock = Math.max(0, currentStock - delta)

        await supabase
          .from("inventory")
          .update({ stock: updatedStock })
          .eq("id", inventoryId)
      }
    }

    revalidatePath("/inventario")
    revalidatePath("/presupuestos")
    revalidatePath("/reparaciones")
    revalidatePath("/")
  } catch (err) {
    console.error("Error al sincronizar stock de inventario con presupuestos:", err)
  }
}
