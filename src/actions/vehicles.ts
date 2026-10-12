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
  } catch (err: any) {
    console.error("Fetch failed in getVehicles:", err)
    return { 
      vehicles: [], 
      error: "No se pudo conectar con Supabase (fetch failed). Verifica si tu proyecto está pausado en Supabase o tus credenciales en .env.local." 
    }
  }
}

export async function createVehicle(data: any) {
  const { error } = await supabase.from("vehicles").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/vehiculos")
  revalidatePath("/clientes")
  if (data.client_id) {
    revalidatePath(`/clientes/${data.client_id}`)
  }
}

export async function updateVehicle(id: string, data: any, clientId?: string) {
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
