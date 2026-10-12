"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface MechanicData {
  id?: string
  name: string
  specialty?: string
  phone?: string
  email?: string
  status: "Activo" | "Inactivo"
}

export async function getMechanics(search?: string) {
  try {
    let query = supabase
      .from("mechanics")
      .select("*, repairs(id, status, reason)")
      .order("name", { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getMechanics:", error.message)
      return { mechanics: [], error: error.message }
    }
    return { mechanics: data || [], error: null }
  } catch (err: any) {
    console.error("Fetch failed in getMechanics:", err)
    return { 
      mechanics: [], 
      error: "No se pudo conectar a la tabla 'mechanics' en Supabase." 
    }
  }
}

export async function getMechanicById(id: string) {
  try {
    const { data, error } = await supabase
      .from("mechanics")
      .select("*, repairs(*, vehicle:vehicles(*, client:clients(*)))")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error getMechanicById:", error.message)
      return null
    }
    return data
  } catch (err: any) {
    console.error("Fetch failed in getMechanicById:", err)
    return null
  }
}

export async function createMechanic(data: MechanicData) {
  const { error } = await supabase.from("mechanics").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/mecanicos")
  revalidatePath("/reparaciones")
}

export async function updateMechanic(id: string, data: Partial<MechanicData>) {
  const { error } = await supabase.from("mechanics").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/mecanicos")
  revalidatePath(`/mecanicos/${id}`)
  revalidatePath("/reparaciones")
}

export async function deleteMechanic(id: string) {
  const { error } = await supabase.from("mechanics").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/mecanicos")
  revalidatePath("/reparaciones")
}

export async function assignRepairToMechanic(repairId: string, mechanicId: string | null) {
  const { error } = await supabase.from("repairs").update({ mechanic_id: mechanicId }).eq("id", repairId)
  if (error) throw new Error(error.message)
  revalidatePath("/mecanicos")
  revalidatePath("/reparaciones")
}
