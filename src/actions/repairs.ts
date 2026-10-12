"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface BudgetItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
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
  const { error } = await supabase.from("repairs").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/reparaciones")
  revalidatePath("/mecanicos")
  if (data.vehicle_id) {
    revalidatePath(`/vehiculos`)
  }
}

export async function updateRepair(id: string, data: Partial<RepairData>) {
  const { error } = await supabase.from("repairs").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/reparaciones")
  revalidatePath(`/reparaciones/${id}`)
  revalidatePath("/mecanicos")
}

export async function deleteRepair(id: string) {
  const { error } = await supabase.from("repairs").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/reparaciones")
  revalidatePath("/mecanicos")
}
