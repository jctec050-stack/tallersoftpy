import { NextRequest } from "next/server"
import { getInvoiceById, InvoiceData } from "@/actions/invoices"
import { InvoicePdfDocument } from "@/components/invoicing/InvoicePdfDocument"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await getInvoiceById(id)

    if (!invoice) {
      return new Response("Factura no encontrada en la base de datos.", { status: 404 })
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePdfDocument, { invoice }) as any
    )

    const filename = `Factura-${invoice.invoice_number.replace(/\s+/g, "_")}.pdf`
    const uint8Array = new Uint8Array(buffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error)
    return new Response(`Error generando PDF de factura: ${error.message}`, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json()) as InvoiceData
    if (!body || !body.invoice_number) {
      return new Response("Datos de factura inválidos", { status: 400 })
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePdfDocument, { invoice: body }) as any
    )

    const filename = `Factura-${body.invoice_number.replace(/\s+/g, "_")}.pdf`
    const uint8Array = new Uint8Array(buffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating invoice PDF via POST:", error)
    return new Response(`Error generando PDF: ${error.message}`, { status: 500 })
  }
}
