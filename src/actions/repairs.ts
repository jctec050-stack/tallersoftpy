"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { syncInventoryStockForBudgetItems } from "@/actions/inventory"

export interface BudgetItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
  inventory_id?: string | null
  item_type?: "service" | "part"
}

export interface RepairData {
  id?: string
  entry_date: string
  vehicle_id: string
  mechanic_id?: string | null
  reason: string
  diagnosis?: string
  priority: "Baja" | "Media" | "Alta"
  status: "Pendiente" | "En Diagnóstico" | "Presupuestado" | "En Reparación" | "Completado" | "Entregado"
  photos?: string[]
  budget_items?: BudgetItem[]
  budget_total?: number
  budget_status?: "Borrador" | "Enviado" | "Aprobado" | "Rechazado"
  mileage?: number | null
  vehicle?: {
    id?: string
    plate?: string
    brand?: string
    model?: string
    year?: number
    mileage?: number
    client?: any
  }
}

export async function getRepairs(search?: string) {
  try {
    let query = supabase
      .from("repairs")
      .select("*, vehicle:vehicles(*, client:clients(*)), mechanic:mechanics(*)")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`reason.ilike.%${search}%,diagnosis.ilike.%${search}%,priority.ilike.%${search}%,status.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getRepairs:", error.message)
      return { repairs: [], error: error.message }
    }
    return { repairs: data || [], error: null }
  } catch (err: any) {
    console.error("Fetch failed in getRepairs:", err)
    return { 
      repairs: [], 
      error: "No se pudo conectar a la tabla de reparaciones. Si no has creado las tablas en Supabase, ejecuta la instrucción SQL de creación." 
    }
  }
}

export async function getRepairById(id: string) {
  try {
    const { data, error } = await supabase
      .from("repairs")
      .select("*, vehicle:vehicles(*, client:clients(*)), mechanic:mechanics(*)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error getRepairById:", error.message)
      return null
    }
    return data
  } catch (err: any) {
    console.error("Fetch failed in getRepairById:", err)
    return null
  }
}

export async function getVehicleRepairHistory(vehicleId: string) {
  try {
    const { data, error } = await supabase
      .from("repairs")
      .select("*, mechanic:mechanics(name)")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error getVehicleRepairHistory:", error.message)
      return []
    }
    return data || []
  } catch (err: any) {
    console.error("Fetch failed in getVehicleRepairHistory:", err)
    return []
  }
}

export async function createRepair(data: RepairData) {
  const { vehicle, ...dbPayload } = data
  let insertPayload: any = { ...dbPayload }
  const { error } = await supabase.from("repairs").insert(insertPayload)
  if (error) {
    if (error.message?.includes("mileage") && insertPayload.mileage !== undefined) {
      delete insertPayload.mileage
      const { error: retryErr } = await supabase.from("repairs").insert(insertPayload)
      if (retryErr) throw new Error(retryErr.message)
    } else {
      throw new Error(error.message)
    }
  }

  // Descontar repuestos del inventario utilizados en el presupuesto
  if (data.budget_items && data.budget_items.length > 0) {
    await syncInventoryStockForBudgetItems(data.budget_items, [])
  }

  revalidatePath("/reparaciones")
  revalidatePath("/mecanicos")
  revalidatePath("/inventario")
  if (data.vehicle_id) {
    revalidatePath(`/vehiculos`)
  }
}

export async function updateRepair(id: string, data: Partial<RepairData>) {
  // Obtener ítems anteriores para calcular la diferencia de stock de repuestos
  let previousItems: BudgetItem[] = []
  if (data.budget_items) {
    const { data: existing } = await supabase
      .from("repairs")
      .select("budget_items")
      .eq("id", id)
      .maybeSingle()
    if (existing && Array.isArray(existing.budget_items)) {
      previousItems = existing.budget_items
    }
  }

  const { vehicle, ...dbPayload } = data
  let updatePayload: any = { ...dbPayload }
  const { error } = await supabase.from("repairs").update(updatePayload).eq("id", id)
  if (error) {
    if (error.message?.includes("mileage") && updatePayload.mileage !== undefined) {
      delete updatePayload.mileage
      const { error: retryErr } = await supabase.from("repairs").update(updatePayload).eq("id", id)
      if (retryErr) throw new Error(retryErr.message)
    } else {
      throw new Error(error.message)
    }
  }

  // Sincronizar stock con la diferencia neta de cantidades
  if (data.budget_items) {
    await syncInventoryStockForBudgetItems(data.budget_items, previousItems)
  }

  revalidatePath("/reparaciones")
  revalidatePath(`/reparaciones/${id}`)
  revalidatePath("/mecanicos")
  revalidatePath("/cobranzas")
  revalidatePath("/inventario")
  revalidatePath("/")
}

export async function updateRepairStatus(id: string, status: RepairData["status"]) {
  const { error } = await supabase.from("repairs").update({ status }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/reparaciones")
  revalidatePath(`/reparaciones/${id}`)
  revalidatePath("/mecanicos")
  revalidatePath("/cobranzas")
  revalidatePath("/")
}

export async function deleteRepair(id: string) {
  // Restaurar repuestos utilizados al inventario si la orden es eliminada
  const { data: existing } = await supabase
    .from("repairs")
    .select("budget_items")
    .eq("id", id)
    .maybeSingle()

  if (existing && Array.isArray(existing.budget_items)) {
    await syncInventoryStockForBudgetItems([], existing.budget_items)
  }

  const { error } = await supabase.from("repairs").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/reparaciones")
  revalidatePath("/mecanicos")
  revalidatePath("/inventario")
}
