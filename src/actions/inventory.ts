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
