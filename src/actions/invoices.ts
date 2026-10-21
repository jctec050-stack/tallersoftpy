"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { formatInvoiceNumber } from "@/lib/invoice-utils"

export interface InvoiceVehicleSummary {
  brand: string
  model: string
  plate: string
  year?: number
  mileage?: number
}

export interface InvoiceRepairSummary {
  repair_id: string
  reason: string
  vehicle?: InvoiceVehicleSummary
  budget_total: number
  items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }>
}

export interface InvoiceData {
  id: string
  created_at?: string
  invoice_number: string // Formato: 001-001-0000123
  date: string // YYYY-MM-DD
  condition: string // "Contado" | "Crédito 30 días" | "Crédito 15 días" | "Transferencia Bancaria"
  status: "Emitida" | "Anulada"
  client_id?: string
  client: {
    id?: string
    name: string
    document?: string
    phone?: string
    email?: string
    address?: string
  }
  repair_ids: string[]
  repairs_summary: InvoiceRepairSummary[]
  subtotal: number
  tax_5: number
  tax_10: number
  tax_total: number
  total: number
  timbrado?: string
  valid_until?: string
}

export async function getInvoices() {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("Aviso en getInvoices (Supabase):", error.message)
      return { invoices: [], error: error.message }
    }

    return { invoices: (data as InvoiceData[]) || [], error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al conectar con la tabla invoices"
    return { invoices: [], error: msg }
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceData | null> {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) return null
    return data as InvoiceData
  } catch (err) {
    console.error("Error getInvoiceById:", err)
    return null
  }
}

export async function createInvoiceRecord(invoice: InvoiceData) {
  try {
    // 1. Marcar los presupuestos seleccionados como Facturados en la tabla repairs
    if (invoice.repair_ids && invoice.repair_ids.length > 0) {
      const { error: repError } = await supabase
        .from("repairs")
        .update({ budget_status: "Facturado" })
        .in("id", invoice.repair_ids)

      if (repError) {
        console.error("Error al marcar repairs como Facturado:", repError.message)
      }
    }

    // 2. Intentar guardar en la tabla invoices de Supabase
    const dbPayload = {
      id: invoice.id,
      invoice_number: formatInvoiceNumber(invoice.invoice_number),
      date: invoice.date,
      condition: invoice.condition,
      status: invoice.status || "Emitida",
      client_id: invoice.client_id || invoice.client?.id || null,
      client_name: invoice.client?.name || "Sin nombre",
      client_document: invoice.client?.document || "",
      client_phone: invoice.client?.phone || "",
      client_address: invoice.client?.address || "",
      repair_ids: invoice.repair_ids,
      repairs_summary: invoice.repairs_summary,
      subtotal: invoice.subtotal,
      tax_5: invoice.tax_5,
      tax_10: invoice.tax_10,
      tax_total: invoice.tax_total,
      total: invoice.total,
    }

    const { error: invError } = await supabase
      .from("invoices")
      .insert(dbPayload)

    if (invError) {
      console.warn("Aviso al guardar en tabla 'invoices' de Supabase (RLS o columnas):", invError.message)
    }

    revalidatePath("/facturacion")
    revalidatePath("/cobranzas")
    revalidatePath("/presupuestos")
    revalidatePath("/reparaciones")
    revalidatePath("/")

    return { success: true, invoice, dbSaved: !invError }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar la factura"
    throw new Error(msg)
  }
}

export async function cancelInvoice(invoiceId: string, repairIds: string[]) {
  try {
    // 1. Revertir presupuestos al estado 'Entregado' para que puedan volver a ser facturados
    if (repairIds && repairIds.length > 0) {
      const { error: repErr } = await supabase
        .from("repairs")
        .update({ budget_status: "Entregado" })
        .in("id", repairIds)

      if (repErr) {
        console.error("Error al revertir repairs a Entregado:", repErr.message)
      }
    }

    // 2. Marcar la factura como Anulada en Supabase
    await supabase
      .from("invoices")
      .update({ status: "Anulada" })
      .eq("id", invoiceId)

    revalidatePath("/facturacion")
    revalidatePath("/cobranzas")
    revalidatePath("/presupuestos")
    revalidatePath("/reparaciones")
    revalidatePath("/")

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al anular la factura"
    throw new Error(msg)
  }
}
