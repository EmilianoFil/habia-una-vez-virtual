import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper rápido para parsar variables de entorno de .env.local sin librerías
const envFile = resolve(__dirname, '../.env.local');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      // Remover comillas si existen
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

let serviceAccount;
try {
  const saKeyData = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saKeyData) {
    throw new Error('La variable FIREBASE_SERVICE_ACCOUNT_KEY está vacía o no existe en .env.local');
  }
  serviceAccount = JSON.parse(saKeyData);
} catch (error) {
  console.error('\n❌ ERROR: No se pudo cargar el JSON del Service Account.');
  console.error('Asegurate de haber pegado el contenido COMPLETO del JSON que descargaste de Firebase dentro de la variable FIREBASE_SERVICE_ACCOUNT_KEY en el archivo .env.local (todo en una sola línea, sin interrupciones).');
  console.error('Detalle:', error.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

async function setSuperAdmin(email) {
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Usuario encontrado en Firebase Auth: UID = ${user.uid}`);
    
    await auth.setCustomUserClaims(user.uid, {
        ...(user.customClaims || {}),
        role: 'superadmin',
        tenantId: null // El superadmin no pertenece a un tenant
    });

    console.log(`\n🎉 ¡Éxito! Privilegios de SuperAdmin configurados para ${email}.`);
    console.log(`👉 CERRÁ SESIÓN y volvé a ingresar en el navegador web para que aplique el nuevo token maestro.`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ERROR:`, error.message);
    process.exit(1);
  }
}

setSuperAdmin('emilianofilgueira@gmail.com');
