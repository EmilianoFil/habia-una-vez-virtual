import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { TenantConfig } from '@/lib/types'

/**
 * Actualiza la configuración de un tenant
 */
export async function updateTenantConfig(tenantId: string, updates: Partial<TenantConfig['configuracion']>) {
  try {
    const tenantRef = doc(db, 'tenants', tenantId)
    
    // Usamos notación de puntos para actualizar solo el objeto configuracion
    await updateDoc(tenantRef, {
      'configuracion': updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('[TenantService] Error updating config:', error)
    throw error
  }
}

/**
 * Actualiza los datos básicos del tenant (nombre, colores, etc)
 */
export async function updateTenantData(tenantId: string, updates: Partial<TenantConfig>) {
  try {
    const tenantRef = doc(db, 'tenants', tenantId)
    
    // Mapear campos planos al objeto config de Firestore
    const firestoreUpdates: any = {
      updatedAt: serverTimestamp()
    }
    
    if (updates.name) firestoreUpdates['config.name'] = updates.name
    if (updates.primaryColor) firestoreUpdates['config.primaryColor'] = updates.primaryColor
    if (updates.secondaryColor) firestoreUpdates['config.secondaryColor'] = updates.secondaryColor
    if (updates.logo !== undefined) firestoreUpdates['config.logo'] = updates.logo

    await updateDoc(tenantRef, firestoreUpdates)
  } catch (error) {
    console.error('[TenantService] Error updating data:', error)
    throw error
  }
}
