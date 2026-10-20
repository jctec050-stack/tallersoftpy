"use server"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getVehicles(search?: string) {
  try {
    let query = supabase
      .from("vehicles")
      .select("*, client:clients(id, name, phone, document)")
      .order("created_at", { ascending: false })
    
    if (search) {
      query = query.or(`plate.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getVehicles:", error.message)
      return { vehicles: [], error: error.message }
    }
    return { vehicles: data || [], error: null }
  } catch (err: unknown) {
    console.error("Fetch failed in getVehicles:", err)
    return { 
      vehicles: [], 
      error: "No se pudo conectar con Supabase (fetch failed). Verifica si tu proyecto está pausado en Supabase o tus credenciales en .env.local." 
    }
  }
}

export async function getVehicleByPlateOrId(identifier: string) {
  try {
    const cleanId = decodeURIComponent(identifier).trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

    let query = supabase
      .from("vehicles")
      .select("*, client:clients(id, name, phone, document, email, address)")

    if (isUuid) {
      query = query.eq("id", cleanId)
    } else {
      query = query.ilike("plate", cleanId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error("Error getVehicleByPlateOrId:", error.message)
      return null
    }
    return data
  } catch (err: unknown) {
    console.error("Fetch failed in getVehicleByPlateOrId:", err)
    return null
  }
}

export async function createVehicle(data: Record<string, unknown>) {
  const { error } = await supabase.from("vehicles").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/vehiculos")
  revalidatePath("/clientes")
  if (data.client_id) {
    revalidatePath(`/clientes/${data.client_id}`)
  }
}

export async function updateVehicle(id: string, data: Record<string, unknown>, clientId?: string) {
  const { error } = await supabase.from("vehicles").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/vehiculos")
  revalidatePath("/clientes")
  if (clientId) {
    revalidatePath(`/clientes/${clientId}`)
  }
}

export async function deleteVehicle(id: string, clientId?: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/vehiculos")
  revalidatePath("/clientes")
  if (clientId) {
    revalidatePath(`/clientes/${clientId}`)
  }
}
