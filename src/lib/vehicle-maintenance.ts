import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
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
 * Obtiene el mapa completo de configuraciones de mantenimiento desde el archivo local de respaldo.
 */
export async function getLocalMaintenanceMap(): Promise<Record<string, VehicleMaintenanceData>> {
  try {
    const raw = await readFile(DATA_FILE_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Guarda el mapa completo de configuraciones de mantenimiento en el archivo local de respaldo.
 */
async function saveLocalMaintenanceMap(map: Record<string, VehicleMaintenanceData>): Promise<void> {
  try {
    const dir = path.dirname(DATA_FILE_PATH)
    await mkdir(dir, { recursive: true })
    await writeFile(DATA_FILE_PATH, JSON.stringify(map, null, 2), "utf-8")
  } catch (err) {
    console.warn("Aviso al guardar respaldo local en vehicle_maintenance.json:", err)
  }
}

/**
 * Obtiene la configuración de mantenimiento para un vehículo específico.
 * Prioriza valores de Supabase si existen; de lo contrario usa el archivo persistente local.
 */
export async function getVehicleMaintenance(
  vehicleId: string,
  plate?: string,
  vehicleRow?: any
): Promise<VehicleMaintenanceData | null> {
  // 1. Si no viene vehicleRow o no tiene las columnas, intentar obtenerlo de Supabase
  let row = vehicleRow
  if (!row) {
    try {
      const { data } = await supabase.from("vehicles").select("*").eq("id", vehicleId).maybeSingle()
      if (data) row = data
    } catch {
      // Ignorar error de red y pasar al almacenamiento local
    }
  }

  // 2. Revisar si la fila de Supabase trajo las columnas de mantenimiento
  if (row) {
    const hasAnySupabaseField =
      row.next_oil_change_km !== undefined ||
      row.next_oil_change_date !== undefined ||
      row.next_differential_km !== undefined ||
      row.next_full_review_km !== undefined

    if (hasAnySupabaseField) {
      const fromDb: VehicleMaintenanceData = {
        vehicleId,
        plate: plate || row.plate,
        nextOilChangeKm: row.next_oil_change_km ?? null,
        nextOilChangeDate: row.next_oil_change_date ?? null,
        nextDifferentialKm: row.next_differential_km ?? null,
        nextFullReviewKm: row.next_full_review_km ?? null,
        updatedAt: row.updated_at,
      }

      // Si tiene al menos un valor definido en la BD, devolverlo
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

  // 3. Si no viene en vehicleRow o viene nulo, buscar en archivo de respaldo local
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
 * Prioriza la persistencia en Supabase (base de datos en la nube compartida entre equipos)
 * y actualiza además la copia local segura.
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

  // 1. Guardar primero en Supabase (base de datos principal compartida)
  let supabaseSuccess = false
  let needsSqlMigration = false
  let dbErrorMessage: string | null = null

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
      console.warn("Supabase no pudo actualizar columnas de mantenimiento:", dbError.message)
      dbErrorMessage = dbError.message
      needsSqlMigration = true
    } else {
      supabaseSuccess = true
    }
  } catch (dbErr: any) {
    console.warn("Excepción al intentar actualizar Supabase:", dbErr)
    dbErrorMessage = dbErr?.message || String(dbErr)
    needsSqlMigration = true
  }

  // 2. Guardar también en respaldo local
  let localSuccess = false
  try {
    const map = await getLocalMaintenanceMap()
    map[vehicleId] = record
    if (plate) {
      map[plate.toUpperCase()] = record
    }
    await saveLocalMaintenanceMap(map)
    localSuccess = true
  } catch (err: any) {
    console.error("Error guardando localmente en vehicle_maintenance.json:", err)
  }

  // Si fallaron tanto Supabase como el archivo local, reportar error explícito
  if (!supabaseSuccess && !localSuccess) {
    return {
      success: false,
      error: `Error al guardar en el servidor: ${dbErrorMessage || "No se pudo acceder a la base de datos ni al archivo local."}`,
    }
  }

  return { success: true, needsSqlMigration }
}
