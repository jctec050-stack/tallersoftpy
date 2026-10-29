"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth"
import { saveVehicleMaintenance, getVehicleMaintenance } from "@/lib/vehicle-maintenance"
import { updateVehicle } from "@/actions/vehicles"

export interface SaveMaintenanceInput {
  vehicleId: string
  plate?: string
  currentMileage?: number | null
  nextOilChangeKm?: number | null
  nextOilChangeDate?: string | null
  nextDifferentialKm?: number | null
  nextFullReviewKm?: number | null
}

export async function updateVehicleMaintenanceAction(input: SaveMaintenanceInput) {
  // 1. Verificar sesión de administrador
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const isAdmin = await verifySessionToken(token)

  if (!isAdmin) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como administrador para modificar los datos de mantenimiento.",
    }
  }

  if (!input.vehicleId) {
    return {
      success: false,
      error: "Identificador de vehículo no válido.",
    }
  }

  // 2. Si el administrador también actualizó el odómetro actual
  if (input.currentMileage !== undefined && input.currentMileage !== null) {
    try {
      await updateVehicle(input.vehicleId, {
        mileage: Number(input.currentMileage),
      })
    } catch (err: any) {
      console.warn("No se pudo actualizar el kilometraje actual en vehicles:", err?.message)
    }
  }

  // 3. Guardar las metas de mantenimiento
  const result = await saveVehicleMaintenance({
    vehicleId: input.vehicleId,
    plate: input.plate,
    nextOilChangeKm: input.nextOilChangeKm,
    nextOilChangeDate: input.nextOilChangeDate,
    nextDifferentialKm: input.nextDifferentialKm,
    nextFullReviewKm: input.nextFullReviewKm,
  })

  // 4. Revalidar las rutas afectadas
  if (input.plate) {
    revalidatePath(`/v/${input.plate}`)
    revalidatePath(`/v/${input.plate.toLowerCase()}`)
  }
  revalidatePath(`/v/${input.vehicleId}`)
  revalidatePath("/vehiculos")
  revalidatePath("/clientes")

  return result
}
