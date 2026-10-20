"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getBudgets(search?: string) {
  try {
    let query = supabase
      .from("repairs")
      .select("*, vehicle:vehicles(*, client:clients(*)), mechanic:mechanics(*)")
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`reason.ilike.%${search}%,diagnosis.ilike.%${search}%,budget_status.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error getBudgets:", error.message)
      return { budgets: [], error: error.message }
    }
    return { budgets: data || [], error: null }
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
