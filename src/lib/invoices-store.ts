import { InvoiceData } from "@/actions/invoices"

const LOCAL_STORAGE_KEY = "tallersoftpy_invoices_history_v1"

export function getLocalStoredInvoices(): InvoiceData[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error("Error al leer facturas de localStorage:", err)
    return []
  }
}

export function saveLocalStoredInvoice(invoice: InvoiceData): InvoiceData[] {
  if (typeof window === "undefined") return []
  try {
    const existing = getLocalStoredInvoices()
    const filtered = existing.filter((i) => i.id !== invoice.id)
    const updated = [invoice, ...filtered]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error al guardar factura en localStorage:", err)
    return []
  }
}

export function markLocalInvoiceAsAnulada(invoiceId: string): InvoiceData[] {
  if (typeof window === "undefined") return []
  try {
    const existing = getLocalStoredInvoices()
    const updated = existing.map((i) => (i.id === invoiceId ? { ...i, status: "Anulada" as const } : i))
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error al anular factura en localStorage:", err)
    return []
  }
}

export function mergeInvoices(serverInvoices: InvoiceData[], localInvoices: InvoiceData[]): InvoiceData[] {
  const map = new Map<string, InvoiceData>()

  // 1. Agregar las de localStorage
  localInvoices.forEach((inv) => {
    if (inv && inv.id) {
      map.set(inv.id, inv)
    }
  })

  // 2. Agregar o sobreescribir con las de Supabase
  serverInvoices.forEach((inv) => {
    if (inv && inv.id) {
      map.set(inv.id, inv)
    }
  })

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
  )
}
