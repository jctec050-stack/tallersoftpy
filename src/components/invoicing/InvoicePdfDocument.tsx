import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { InvoiceData } from "@/actions/invoices"
import { numberToWordsGuaranies } from "@/lib/invoice-utils"
import { WORKSHOP_CONFIG } from "@/lib/company-config"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#18181b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  companyBox: {
    flex: 3,
    paddingRight: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    letterSpacing: 0.5,
  },
  companyActivity: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#3f3f46",
    marginTop: 2,
    textTransform: "uppercase",
  },
  companyInfo: {
    fontSize: 7,
    color: "#52525b",
    marginTop: 2,
  },
  invoiceBox: {
    flex: 2,
    borderLeftWidth: 1,
    borderLeftColor: "#18181b",
    paddingLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  timbradoText: {
    fontSize: 7,
    color: "#52525b",
    textAlign: "center",
  },
  rucText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    marginVertical: 2,
  },
  facturaTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#b91c1c",
    marginTop: 2,
  },
  clientBox: {
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  clientField: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#27272a",
    marginRight: 4,
  },
  value: {
    fontSize: 8,
    color: "#09090b",
  },
  conditionBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  colCant: { width: "7%", textAlign: "center", fontSize: 7, fontFamily: "Helvetica-Bold" },
  colDesc: { width: "47%", fontSize: 7, fontFamily: "Helvetica-Bold" },
  colPrice: { width: "14%", textAlign: "right", fontSize: 7, fontFamily: "Helvetica-Bold" },
  colExentas: { width: "10%", textAlign: "right", fontSize: 7, fontFamily: "Helvetica-Bold" },
  colIva5: { width: "10%", textAlign: "right", fontSize: 7, fontFamily: "Helvetica-Bold" },
  colIva10: { width: "12%", textAlign: "right", fontSize: 7, fontFamily: "Helvetica-Bold" },

  budgetHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#e4e4e7",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
  },
  budgetHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    alignItems: "center",
  },
  cellText: {
    fontSize: 7.5,
    color: "#27272a",
  },
  totalsBox: {
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalWordsText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#27272a",
    flex: 1,
    paddingRight: 10,
  },
  totalAmountText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
  },
  taxBox: {
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 4,
    padding: 5,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taxCol: {
    alignItems: "center",
    flex: 1,
  },
  taxTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#52525b",
    textTransform: "uppercase",
  },
  taxValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6.5,
    color: "#71717a",
  },
  originalBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#3f3f46",
    textTransform: "uppercase",
  },
})

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(amount)
  }

  const client = invoice.client || { name: "Cliente General" }
  const repairs = invoice.repairs_summary || []
  const total = invoice.total || 0
  const amountWords = numberToWordsGuaranies(total)

  return (
    <Document title={`Factura-${invoice.invoice_number} - ${WORKSHOP_CONFIG.name}`} author={WORKSHOP_CONFIG.name}>
      <Page size="A4" style={styles.page}>
        {/* 1. Encabezado Oficial */}
        <View style={styles.header}>
          <View style={styles.companyBox}>
            <Text style={styles.companyName}>{WORKSHOP_CONFIG.name}</Text>
            <Text style={styles.companyActivity}>{WORKSHOP_CONFIG.activity}</Text>
            <Text style={styles.companyInfo}>Dirección: {WORKSHOP_CONFIG.address}</Text>
            <Text style={styles.companyInfo}>Teléfono / WhatsApp: {WORKSHOP_CONFIG.phone}</Text>
            <Text style={styles.companyInfo}>Email: {WORKSHOP_CONFIG.email}</Text>
          </View>

          <View style={styles.invoiceBox}>
            <Text style={styles.timbradoText}>TIMBRADO N° {invoice.timbrado || WORKSHOP_CONFIG.timbrado}</Text>
            <Text style={styles.timbradoText}>Válido hasta: {invoice.valid_until || WORKSHOP_CONFIG.validUntil}</Text>
            <Text style={styles.rucText}>RUC: {WORKSHOP_CONFIG.ruc}</Text>
            <Text style={styles.facturaTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>N° {invoice.invoice_number}</Text>
          </View>
        </View>

        {/* 2. Datos del Cliente y Emisión */}
        <View style={styles.clientBox}>
          <View style={styles.clientRow}>
            <View style={[styles.clientField, { flex: 3 }]}>
              <Text style={styles.label}>Fecha de Emisión:</Text>
              <Text style={styles.value}>
                {invoice.date ? new Date(invoice.date + "T00:00:00").toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" }) : "Fecha actual"}
              </Text>
            </View>
            <View style={[styles.clientField, { flex: 2, justifyContent: "flex-end" }]}>
              <Text style={styles.label}>Condición de Venta:</Text>
              <Text style={styles.conditionBadge}>{invoice.condition.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.clientRow}>
            <View style={[styles.clientField, { flex: 3 }]}>
              <Text style={styles.label}>Nombre o Razón Social:</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{client.name}</Text>
            </View>
            <View style={[styles.clientField, { flex: 2, justifyContent: "flex-end" }]}>
              <Text style={styles.label}>R.U.C. / C.I.:</Text>
              <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{client.document || "Sin Documento"}</Text>
            </View>
          </View>

          <View style={styles.clientRow}>
            <View style={[styles.clientField, { flex: 3 }]}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{client.address || "Asunción, Paraguay"}</Text>
            </View>
            <View style={[styles.clientField, { flex: 2, justifyContent: "flex-end" }]}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{client.phone || "No especificado"}</Text>
            </View>
          </View>
        </View>

        {/* 3. Tabla de Trabajos y Presupuestos Incluidos */}
        <View style={styles.table}>
          {/* Encabezado de Columnas Legal Paraguayo */}
          <View style={styles.tableHeader}>
            <Text style={styles.colCant}>CANT.</Text>
            <Text style={styles.colDesc}>DESCRIPCIÓN DE TRABAJOS Y REPUESTOS</Text>
            <Text style={styles.colPrice}>PRECIO UNIT.</Text>
            <Text style={styles.colExentas}>EXENTAS</Text>
            <Text style={styles.colIva5}>5%</Text>
            <Text style={styles.colIva10}>10%</Text>
          </View>

          {/* Iteración de Presupuestos agrupados */}
          {repairs.length === 0 ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: "#71717a" }}>No se registraron detalles de ítems.</Text>
            </View>
          ) : (
            repairs.map((rep, idx) => {
              const v = rep.vehicle
              const vehicleLabel = v
                ? `${v.brand} ${v.model} (Chapa: ${v.plate})${v.mileage ? ` · ${v.mileage.toLocaleString()} km` : ""}`
                : "Vehículo en taller"

              return (
                <View key={idx}>
                  {/* Encabezado por presupuesto/vehículo */}
                  <View style={styles.budgetHeaderRow}>
                    <Text style={styles.budgetHeaderText}>
                      🚗 ORDEN #{rep.repair_id ? rep.repair_id.slice(0, 8).toUpperCase() : `TRAB-${idx + 1}`} | {vehicleLabel} | Trabajo: {rep.reason}
                    </Text>
                  </View>

                  {/* Ítems del presupuesto */}
                  {rep.items && rep.items.length > 0 ? (
                    rep.items.map((item, itemIdx) => (
                      <View key={itemIdx} style={styles.tableRow}>
                        <Text style={[styles.colCant, styles.cellText]}>{item.quantity}</Text>
                        <Text style={[styles.colDesc, styles.cellText]}>{item.description}</Text>
                        <Text style={[styles.colPrice, styles.cellText]}>{formatCurrency(item.price)}</Text>
                        <Text style={[styles.colExentas, styles.cellText]}>0</Text>
                        <Text style={[styles.colIva5, styles.cellText]}>0</Text>
                        <Text style={[styles.colIva10, styles.cellText, { fontFamily: "Helvetica-Bold" }]}>
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tableRow}>
                      <Text style={[styles.colCant, styles.cellText]}>1</Text>
                      <Text style={[styles.colDesc, styles.cellText]}>{rep.reason || "Servicio Técnico Integral"}</Text>
                      <Text style={[styles.colPrice, styles.cellText]}>{formatCurrency(rep.budget_total)}</Text>
                      <Text style={[styles.colExentas, styles.cellText]}>0</Text>
                      <Text style={[styles.colIva5, styles.cellText]}>0</Text>
                      <Text style={[styles.colIva10, styles.cellText, { fontFamily: "Helvetica-Bold" }]}>
                        {formatCurrency(rep.budget_total)}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        {/* 4. Resumen de Totales y Letras */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalWordsText}>
              VALOR EN LETRAS: {amountWords}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold" }}>TOTAL A PAGAR: ₲</Text>
              <Text style={styles.totalAmountText}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* 5. Liquidación del IVA (Fiscal Paraguayo) */}
        <View style={styles.taxBox}>
          <View style={styles.taxCol}>
            <Text style={styles.taxTitle}>Liquidación del IVA (5%)</Text>
            <Text style={styles.taxValue}>0</Text>
          </View>
          <View style={styles.taxCol}>
            <Text style={styles.taxTitle}>Liquidación del IVA (10%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(invoice.tax_10 || Math.round(total / 11))}</Text>
          </View>
          <View style={styles.taxCol}>
            <Text style={styles.taxTitle}>TOTAL IVA (₲)</Text>
            <Text style={styles.taxValue}>{formatCurrency(invoice.tax_total || Math.round(total / 11))}</Text>
          </View>
        </View>

        {/* 6. Pie de Página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Emitido conforme a las reglamentaciones vigentes (DNIT / Ley 6380/19)
          </Text>
          <Text style={styles.originalBadge}>ORIGINAL: CLIENTE / DUPLICADO: ARCHIVO</Text>
        </View>
      </Page>
    </Document>
  )
}
