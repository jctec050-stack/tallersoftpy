/**
 * Utilidades para facturación legal y física paraguaya
 */

// Formatear número de factura legal (ej: 001-001-0000045)
export function formatInvoiceNumber(input: string, fallbackSeq = 1): string {
  if (!input || !input.trim()) {
    const seqStr = String(fallbackSeq).padStart(7, "0")
    return `001-001-${seqStr}`
  }

  const clean = input.trim()
  // Si ya tiene el formato 000-000-0000000, respetarlo
  if (/^\d{3}-\d{3}-\d{7}$/.test(clean)) {
    return clean
  }

  // Si solo ingresó dígitos o un número corto, convertir a formato estándar
  const digits = clean.replace(/\D/g, "")
  if (digits.length <= 7) {
    return `001-001-${digits.padStart(7, "0")}`
  }

  return clean
}

// Calcular liquidación de IVA en Paraguay (IVA 10% incluido = Total / 11)
export function calculateTaxParaguay(total: number, taxRate: "10%" | "5%" | "exenta" = "10%") {
  if (taxRate === "exenta") {
    return { exenta: total, gravada5: 0, gravada10: 0, iva5: 0, iva10: 0, totalIva: 0 }
  }
  if (taxRate === "5%") {
    const iva5 = Math.round(total / 21)
    return { exenta: 0, gravada5: total, gravada10: 0, iva5, iva10: 0, totalIva: iva5 }
  }
  // 10% estándar para servicios mecánicos y repuestos
  const iva10 = Math.round(total / 11)
  return { exenta: 0, gravada5: 0, gravada10: total, iva5: 0, iva10, totalIva: iva10 }
}

// Convertir números a letras en español para Guaraníes
export function numberToWordsGuaranies(amount: number): string {
  const rounded = Math.round(Math.abs(amount))
  if (rounded === 0) return "CERO GUARANÍES"

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"]
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"]
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]

  function convertirGrupo(n: number): string {
    let output = ""
    if (n === 100) return "CIEN"

    const c = Math.floor(n / 100)
    const d = Math.floor((n % 100) / 10)
    const u = n % 10

    if (c > 0) output += centenas[c] + " "

    if (d === 1 && u > 0) {
      output += especiales[u]
      return output.trim()
    }

    if (d === 2 && u > 0) {
      output += "VEINTI" + unidades[u]
      return output.trim()
    }

    if (d > 0) {
      output += decenas[d]
      if (u > 0) output += " Y "
    }

    if (u > 0 && d !== 1 && !(d === 2 && u > 0)) {
      output += unidades[u]
    }

    return output.trim()
  }

  let n = rounded
  let millones = Math.floor(n / 1000000)
  n %= 1000000
  let miles = Math.floor(n / 1000)
  let unidadesResto = n % 1000

  let resultado = ""

  if (millones > 0) {
    if (millones === 1) {
      resultado += "UN MILLÓN "
    } else {
      resultado += convertirGrupo(millones) + " MILLONES "
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      resultado += "MIL "
    } else {
      resultado += convertirGrupo(miles) + " MIL "
    }
  }

  if (unidadesResto > 0) {
    resultado += convertirGrupo(unidadesResto) + " "
  }

  return `${resultado.trim()} GUARANÍES`
}
