import { NextRequest } from "next/server"
import { getRepairById } from "@/actions/repairs"
import { BudgetPdfDocument } from "@/components/repairs/BudgetPdfDocument"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repair = await getRepairById(id)

    if (!repair) {
      return new Response("Presupuesto no encontrado", { status: 404 })
    }

    const buffer = await renderToBuffer(
      React.createElement(BudgetPdfDocument, { repair }) as any
    )

    const filename = `Presupuesto-PRES-${repair.id.slice(0, 8)}.pdf`
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
    console.error("Error generating PDF:", error)
    return new Response(`Error generando PDF: ${error.message}`, { status: 500 })
  }
}
