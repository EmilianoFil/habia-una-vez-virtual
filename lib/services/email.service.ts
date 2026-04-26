import nodemailer from 'nodemailer'
import { EmailSettings, NotaCuaderno } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://habia-una-vez-virtual.web.app'

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTransporter(settings: EmailSettings) {
  return nodemailer.createTransport({
    service: settings.provider === 'gmail' ? 'gmail' : undefined,
    host: settings.provider === 'smtp' ? settings.host : undefined,
    port: settings.provider === 'smtp' ? settings.port : undefined,
    auth: {
      user: settings.email,
      pass: settings.appPassword,
    },
    // Forzar TLS para SMTP si es necesario
    secure: settings.provider === 'smtp' && settings.port === 465,
  })
}

/**
 * Envía un mail de bienvenida con el link de reseteo de clave.
 * Si se provee templateHtml, aplica sustitución de variables {{...}}.
 * Variables disponibles: reset_link, institucion, app_url, fecha
 */
export async function sendWelcomeEmail(
  settings: EmailSettings,
  to: string,
  resetLink: string,
  tenantName: string,
  templateHtml?: string | null
) {
  if (!settings.enabled || !settings.email || !settings.appPassword) return

  const transporter = getTransporter(settings)

  let htmlContent: string
  if (templateHtml) {
    const vars: Record<string, string> = {
      reset_link: resetLink,
      institucion: tenantName,
      app_url: resetLink,
      fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
    }
    htmlContent = applyTemplate(templateHtml, vars)
  } else {
    htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">¡Bienvenido a ${tenantName}!</h2>
      <p>Hola,</p>
      <p>Se te ha concedido acceso al cuaderno virtual de tu hijo/a en nuestra institución.</p>
      <p>Para poder ingresar y ver toda la información, necesitas configurar tu contraseña haciendo clic en el siguiente botón:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">
          Configurar mi contraseña
        </a>
      </div>
      <p style="font-size: 12px; color: #666; background: #f9fafb; padding: 15px; border-radius: 8px;">
        Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <span style="color: #6366f1; word-break: break-all;">${resetLink}</span>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 11px; color: #999; text-align: center;">Esta es una notificación automática de ${tenantName} vía Había una vez Virtual.</p>
    </div>
  `
  }

  await transporter.sendMail({
    from: `"${tenantName}" <${settings.email}>`,
    to,
    subject: `Acceso concedido — ${tenantName}`,
    html: htmlContent,
  })
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function buildDefaultNoteHtml(nota: NotaCuaderno, tenantName: string, preview: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="background-color: #6366f1; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Nueva comunicación</h1>
        <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">${tenantName}</p>
      </div>
      <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: white;">
        <h2 style="margin-top: 0; color: #111827;">${nota.titulo}</h2>
        <p style="color: #4b5563;">${preview}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/login" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Ver cuaderno completo
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; margin-top: 20px; padding-top: 15px;">
          Enviado por: ${nota.autorNombre} (${nota.autorRol === 'admin' ? 'Administración' : 'Docente'})
        </p>
      </div>
      <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
        Recibes este mail porque eres tutor/a en ${tenantName}.<br>
        Había una vez Virtual.
      </p>
    </div>
  `
}

/**
 * Envía notificación de nueva comunicación en el cuaderno.
 * Si se provee templateHtml, aplica sustitución de variables {{...}} en el HTML.
 * Variables: titulo, contenido, contenido_texto, autor, rol, institucion, app_url, fecha
 */
export async function sendNoteEmail(
  settings: EmailSettings,
  to: string,
  nota: NotaCuaderno,
  tenantName: string,
  templateHtml?: string | null
) {
  if (!settings.enabled || !settings.email || !settings.appPassword) return

  const transporter = getTransporter(settings)
  const preview = stripHtmlToText(nota.contenido).slice(0, 150) + '...'

  let htmlContent: string
  if (templateHtml) {
    const vars: Record<string, string> = {
      titulo: nota.titulo,
      contenido: nota.contenido,
      contenido_texto: preview,
      autor: nota.autorNombre,
      rol: nota.autorRol === 'admin' ? 'Administración' : 'Docente',
      institucion: tenantName,
      app_url: APP_URL,
      fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
    }
    htmlContent = applyTemplate(templateHtml, vars)
  } else {
    htmlContent = buildDefaultNoteHtml(nota, tenantName, preview)
  }

  await transporter.sendMail({
    from: `"${tenantName}" <${settings.email}>`,
    to,
    subject: `📝 Nueva nota: ${nota.titulo}`,
    html: htmlContent,
  })
}

/**
 * Envía un comunicado institucional (broadcast a todas las familias).
 */
export async function sendAnnouncementEmail(
  settings: EmailSettings,
  to: string,
  titulo: string,
  contenido: string,
  autorNombre: string,
  tenantName: string,
  templateHtml?: string | null
) {
  if (!settings.enabled || !settings.email || !settings.appPassword) return

  const transporter = getTransporter(settings)
  const preview = stripHtmlToText(contenido).slice(0, 150) + '...'

  let htmlContent: string
  if (templateHtml) {
    const vars: Record<string, string> = {
      titulo,
      contenido,
      contenido_texto: preview,
      autor: autorNombre,
      rol: 'Administración',
      institucion: tenantName,
      app_url: APP_URL,
      fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
    }
    htmlContent = applyTemplate(templateHtml, vars)
  } else {
    htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #6366f1; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">📣 Comunicado institucional</h1>
          <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">${tenantName}</p>
        </div>
        <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: white;">
          <h2 style="margin-top: 0; color: #111827;">${titulo}</h2>
          <div style="color: #4b5563;">${contenido}</div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Abrir la app
            </a>
          </div>
          <p style="font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; margin-top: 20px; padding-top: 15px;">
            Enviado por: ${autorNombre} — ${tenantName}
          </p>
        </div>
        <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
          Recibes este mail porque eres tutor/a registrado/a en ${tenantName}.<br>
          Había una vez Virtual.
        </p>
      </div>
    `
  }

  await transporter.sendMail({
    from: `"${tenantName}" <${settings.email}>`,
    to,
    subject: `📣 ${titulo} — ${tenantName}`,
    html: htmlContent,
  })
}
