import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Ein Abschnitt: Aufbau und Schrift von shadcns Card (die Card*-Teile darin verwenden), aber
 * ohne Kasten. Abschnitte trennen Linien im Seitenlayout (ohmtools-Design: keine Boxen).
 */
export function Section({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn('bg-transparent shadow-none ring-0 [--card-spacing:--spacing(6)]', className)}
      {...props}
    />
  )
}
