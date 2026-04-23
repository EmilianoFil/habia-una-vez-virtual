import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'primary' | 'indigo' | 'green' | 'amber' | 'sky'

const variants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-600',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  error:    'bg-red-100 text-red-700',
  primary:  'text-white',
  indigo:   'bg-indigo-100 text-indigo-700',
  green:    'bg-emerald-100 text-emerald-700',
  amber:    'bg-orange-100 text-orange-700',
  sky:      'bg-sky-100 text-sky-700',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  useTenantColor?: boolean
}

export function Badge({ children, variant = 'default', className, useTenantColor }: BadgeProps) {
  return (
    <span
      className={cn('badge', variants[variant], className)}
      style={useTenantColor ? { backgroundColor: 'var(--color-primary-10)', color: 'var(--color-primary)' } : undefined}
    >
      {children}
    </span>
  )
}

/** Badge para el turno de una sala o docente */
export function TurnoBadge({ turno }: { turno: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    mañana:    { label: 'Mañana',    variant: 'sky' },
    tarde:     { label: 'Tarde',     variant: 'amber' },
    vespertino:{ label: 'Vespertino',variant: 'indigo' },
    completo:  { label: 'Completo',  variant: 'green' },
  }
  const config = map[turno] ?? { label: turno, variant: 'default' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
