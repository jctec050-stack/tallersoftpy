import fs from "fs/promises"
import path from "path"
import { supabase } from "@/lib/supabase"

export interface VehicleMaintenanceData {
  vehicleId: string
  plate?: string
  nextOilChangeKm?: number | null
  nextOilChangeDate?: string | null // Formato YYYY-MM-DD
  nextDifferentialKm?: number | null
  nextFullReviewKm?: number | null
  updatedAt?: string
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "vehicle_maintenance.json")

/**
 * Obtiene el mapa completo de configuraciones de mantenimiento desde el archivo local.
 */
export async function getLocalMaintenanceMap(): Promise<Record<string, VehicleMaintenanceData>> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Guarda el mapa completo de configuraciones de mantenimiento en el archivo local.
 */
async function saveLocalMaintenanceMap(map: Record<string, VehicleMaintenanceData>): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(map, null, 2), "utf-8")
}

/**
 * Obtiene la configuración de mantenimiento para un vehículo específico.
 * Prioriza valores de Supabase si las columnas existen; de lo contrario usa el archivo persistente local.
 */
export async function getVehicleMaintenance(
  vehicleId: string,
  plate?: string,
  vehicleRow?: any
): Promise<VehicleMaintenanceData | null> {
  // 1. Revisar si la fila de Supabase ya trajo las columnas
  if (vehicleRow) {
    const hasAnySupabaseField =
      vehicleRow.next_oil_change_km !== undefined ||
      vehicleRow.next_oil_change_date !== undefined ||
      vehicleRow.next_differential_km !== undefined ||
      vehicleRow.next_full_review_km !== undefined

    if (hasAnySupabaseField) {
      const fromDb: VehicleMaintenanceData = {
        vehicleId,
        plate: plate || vehicleRow.plate,
        nextOilChangeKm: vehicleRow.next_oil_change_km ?? null,
        nextOilChangeDate: vehicleRow.next_oil_change_date ?? null,
        nextDifferentialKm: vehicleRow.next_differential_km ?? null,
        nextFullReviewKm: vehicleRow.next_full_review_km ?? null,
        updatedAt: vehicleRow.updated_at,
      }

      // Si tiene al menos un valor no nulo en la BD, devolverlo
      if (
        fromDb.nextOilChangeKm !== null ||
        fromDb.nextOilChangeDate !== null ||
        fromDb.nextDifferentialKm !== null ||
        fromDb.nextFullReviewKm !== null
      ) {
        return fromDb
      }
    }
  }

  // 2. Si no viene en vehicleRow o viene nulo, buscar en archivo local
  const map = await getLocalMaintenanceMap()
  const byId = map[vehicleId]
  if (byId) return byId

  if (plate) {
    const cleanPlate = plate.trim().toUpperCase()
    for (const item of Object.values(map)) {
      if (item.plate && item.plate.trim().toUpperCase() === cleanPlate) {
        return item
      }
    }
  }

  return null
}

/**
 * Guarda los valores personalizados de mantenimiento para un vehículo.
 * Intenta sincronizar con Supabase y persiste localmente en JSON.
 */
export async function saveVehicleMaintenance(data: {
  vehicleId: string
  plate?: string
  nextOilChangeKm?: number | null
  nextOilChangeDate?: string | null
  nextDifferentialKm?: number | null
  nextFullReviewKm?: number | null
}): Promise<{ success: boolean; needsSqlMigration?: boolean; error?: string }> {
  const { vehicleId, plate, nextOilChangeKm, nextOilChangeDate, nextDifferentialKm, nextFullReviewKm } = data

  const record: VehicleMaintenanceData = {
    vehicleId,
    plate: plate?.toUpperCase(),
    nextOilChangeKm: nextOilChangeKm !== undefined && nextOilChangeKm !== null ? Number(nextOilChangeKm) : null,
    nextOilChangeDate: nextOilChangeDate?.trim() || null,
    nextDifferentialKm: nextDifferentialKm !== undefined && nextDifferentialKm !== null ? Number(nextDifferentialKm) : null,
    nextFullReviewKm: nextFullReviewKm !== undefined && nextFullReviewKm !== null ? Number(nextFullReviewKm) : null,
    updatedAt: new Date().toISOString(),
  }

  // 1. Guardar siempre en archivo local seguro
  try {
    const map = await getLocalMaintenanceMap()
    map[vehicleId] = record
    if (plate) {
      map[plate.toUpperCase()] = record
    }
    await saveLocalMaintenanceMap(map)
  } catch (err: any) {
    console.error("Error guardando localmente en vehicle_maintenance.json:", err)
    return { success: false, error: "Error al guardar en el almacenamiento del servidor." }
  }

  // 2. Intentar guardar en Supabase (si las columnas existen)
  let needsSqlMigration = false
  try {
    const updatePayload: Record<string, any> = {
      next_oil_change_km: record.nextOilChangeKm,
      next_oil_change_date: record.nextOilChangeDate,
      next_differential_km: record.nextDifferentialKm,
      next_full_review_km: record.nextFullReviewKm,
      updated_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabase
      .from("vehicles")
      .update(updatePayload)
      .eq("id", vehicleId)

    if (dbError) {
      console.warn("Supabase no pudo actualizar columnas de mantenimiento (pendiente migración SQL):", dbError.message)
      needsSqlMigration = true
    }
  } catch (dbErr: any) {
    console.warn("Excepción al intentar actualizar Supabase:", dbErr)
    needsSqlMigration = true
  }

  return { success: true, needsSqlMigration }
}
