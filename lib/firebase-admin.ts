/**
 * Firebase Admin SDK — solo para Server Components y API Routes.
 * NUNCA importar en componentes del browser (client components).
 */
import { cert, getApps, initializeApp, App, ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

let adminApp: App

function getAdminCredential(): ServiceAccount {
  // Opción A: JSON completo como variable de entorno
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount
  }

  // Opción B: variables individuales
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  // Fallback para desarrollo (sin admin credentials)
  // En este modo el Admin SDK no funciona pero no rompe el build
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'habia-una-vez-virtual',
    clientEmail: 'mock@mock.com',
    privateKey: '',
  }
}

if (!getApps().length) {
  try {
    adminApp = initializeApp({
      credential: cert(getAdminCredential()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } catch (e) {
    // En desarrollo sin credenciales, inicializar solo con projectId
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'habia-una-vez-virtual',
    })
  }
} else {
  adminApp = getApps()[0]
}

export const adminDb: Firestore = getFirestore(adminApp)
export const adminAuth: Auth = getAuth(adminApp)
export const adminStorage = getStorage(adminApp)
export default adminApp
