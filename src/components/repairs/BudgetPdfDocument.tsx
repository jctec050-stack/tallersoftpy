import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#18181b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 14,
    marginBottom: 14,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  orderTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#a1a1aa",
    textAlign: "right",
    letterSpacing: 0.8,
  },
  orderNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    textAlign: "right",
    marginTop: 2,
  },
  orderDate: {
    fontSize: 8,
    color: "#71717a",
    textAlign: "right",
    marginTop: 2,
  },
  badgeStatus: {
    alignSelf: "flex-end",
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
    fontSize: 7.5,
    color: "#3f3f46",
    fontFamily: "Helvetica-Bold",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  infoBoxBold: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  infoBoxText: {
    fontSize: 8,
    color: "#4b5563",
    marginBottom: 1.5,
  },
  reasonBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#18181b",
    paddingLeft: 8,
    marginBottom: 14,
  },
  reasonText: {
    fontSize: 8.5,
    color: "#1f2937",
    marginBottom: 2,
  },
  tableTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thDesc: { flex: 4, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151" },
  thQty: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", textAlign: "center" },
  thPrice: { flex: 2, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", textAlign: "right" },
  thTotal: { flex: 2, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tdDesc: { flex: 4, fontSize: 8, color: "#111827", fontFamily: "Helvetica-Bold" },
  tdQty: { flex: 1, fontSize: 8, color: "#4b5563", textAlign: "center" },
  tdPrice: { flex: 2, fontSize: 8, color: "#4b5563", textAlign: "right" },
  tdTotal: { flex: 2, fontSize: 8, color: "#111827", fontFamily: "Helvetica-Bold", textAlign: "right" },
  emptyRow: {
    paddingVertical: 12,
    textAlign: "center",
    color: "#9ca3af",
    fontStyle: "italic",
    fontSize: 8,
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  footerTotal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#34d399",
  },
  disclaimer: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
    marginTop: 4,
  },
})

interface BudgetItem {
  id?: string
  description: string
  quantity: number
  price: number
  total: number
}

interface BudgetPdfDocumentProps {
  repair: {
    id: string
    entry_date: string
    reason: string
    diagnosis?: string
    priority?: string
    status?: string
    budget_items?: BudgetItem[]
    budget_total?: number
    budget_status?: string
    vehicle?: {
      plate: string
      brand: string
      model: string
      year?: number
      mileage?: number
      client?: {
        name: string
        document?: string
        phone?: string
        email?: string
        address?: string
      }
    }
  }
}

export function BudgetPdfDocument({ repair }: BudgetPdfDocumentProps) {
  const items = repair.budget_items || []
  const total = repair.budget_total || items.reduce((sum, i) => sum + (i.total || 0), 0)
  const client = repair.vehicle?.client
  const vehicle = repair.vehicle

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-PY").format(num)
  }

  const formatGs = (num: number) => {
    return `Gs. ${formatNumber(num)}`
  }

  const formattedDate = repair.entry_date
    ? new Date(repair.entry_date).toLocaleDateString("es-PY")
    : new Date().toLocaleDateString("es-PY")

  return (
    <Document title={`Presupuesto #${repair.id.slice(0, 8)} - Taller San Luis`}>
      <Page size="A4" style={styles.page}>
        {/* Header Empresa */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>TALLER SAN LUIS</Text>
            <Text style={styles.companySubtitle}>Servicio Automotriz Multimarca & Mantenimiento</Text>
            <Text style={styles.companySubtitle}>Hernandarias - Paraguay | Tel: 0975 882 828</Text>
          </View>
          <View>
            <Text style={styles.orderTitle}>ORDEN DE TRABAJO</Text>
            <Text style={styles.orderNumber}>#PRES-{repair.id.slice(0, 8)}</Text>
            <Text style={styles.orderDate}>Fecha: {formattedDate}</Text>
            <Text style={styles.badgeStatus}>Estado: {repair.budget_status || "Borrador"}</Text>
          </View>
        </View>

        {/* Datos Cliente y Vehículo */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>DATOS DEL CLIENTE</Text>
            <Text style={styles.infoBoxBold}>{client?.name || "Cliente General"}</Text>
            <Text style={styles.infoBoxText}>RUC/CI: {client?.document || "S/D"}</Text>
            <Text style={styles.infoBoxText}>Teléfono: {client?.phone || "S/T"}</Text>
            {client?.address ? <Text style={styles.infoBoxText}>Dirección: {client.address}</Text> : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>DATOS DEL VEHÍCULO</Text>
            {vehicle ? (
              <>
                <Text style={styles.infoBoxBold}>{vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}</Text>
                <Text style={styles.infoBoxText}>Chapa: {vehicle.plate || "S/C"}</Text>
                <Text style={styles.infoBoxText}>
                  Kilometraje: {vehicle.mileage ? `${formatNumber(vehicle.mileage)} km` : "No registrado"}
                </Text>
              </>
            ) : (
              <Text style={styles.infoBoxText}>Sin vehículo asignado</Text>
            )}
          </View>
        </View>

        {/* Motivo y Diagnóstico */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Motivo de Ingreso: </Text>
            {repair.reason}
          </Text>
          {repair.diagnosis ? (
            <Text style={styles.reasonText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Diagnóstico Técnico: </Text>
              {repair.diagnosis}
            </Text>
          ) : null}
        </View>

        {/* Tabla de Repuestos y Servicios */}
        <Text style={styles.tableTitle}>Detalle de Repuestos y Servicios</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>DESCRIPCIÓN</Text>
            <Text style={styles.thQty}>CANT.</Text>
            <Text style={styles.thPrice}>PRECIO UNIT.</Text>
            <Text style={styles.thTotal}>SUBTOTAL</Text>
          </View>
          {items.length === 0 ? (
            <Text style={styles.emptyRow}>No hay ítems cargados en este presupuesto.</Text>
          ) : (
            items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tdDesc}>{item.description}</Text>
                <Text style={styles.tdQty}>{item.quantity}</Text>
                <Text style={styles.tdPrice}>{formatGs(item.price)}</Text>
                <Text style={styles.tdTotal}>{formatGs(item.total)}</Text>
              </View>
            ))
          )}
          <View style={styles.tableFooter}>
            <Text style={styles.footerLabel}>TOTAL DEL PRESUPUESTO:</Text>
            <Text style={styles.footerTotal}>{formatGs(total)}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Presupuesto válido por 7 días hábiles. Sujeto a variaciones por fallas ocultas detectadas durante el desarme.
        </Text>
      </Page>
    </Document>
  )
}
