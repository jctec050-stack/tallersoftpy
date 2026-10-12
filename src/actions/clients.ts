"use server"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getClients(search?: string) {
  try {
    let query = supabase
      .from("clients")
      .select("*, vehicles(id, plate, brand, model, year, mileage)")
      .order("name", { ascending: true })
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error query clients:", error.message)
      return { clients: [], error: error.message }
    }
    return { clients: data || [], error: null }
  } catch (err: any) {
    console.error("Fetch failed in getClients:", err)
    return { 
      clients: [], 
      error: "No se pudo conectar con Supabase (fetch failed). Verifica si tu proyecto está pausado en el Dashboard de Supabase o tus credenciales en .env.local." 
    }
  }
}

export async function getClientById(id: string) {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*, vehicles(*)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error getClientById:", error.message)
      return null
    }
    return data
  } catch (err: any) {
    console.error("Fetch failed in getClientById:", err)
    return null
  }
}

export async function createClient(data: any) {
  const { error } = await supabase.from("clients").insert(data)
  if (error) throw new Error(error.message)
  revalidatePath("/clientes")
}

export async function updateClient(id: string, data: any) {
  const { error } = await supabase.from("clients").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/clientes")
  revalidatePath(`/clientes/${id}`)
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/clientes")
}
