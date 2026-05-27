import { credibilityLabel } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function CredibilityBadge({ score, showLabel = true, size = 'sm' }: Props) {
  const { label, color, bg } = credibilityLabel(score)
  const bar = Math.round(score / 10)

  return (
    <span title={`Credibility: ${score}/100`}
      className={cn('badge gap-1.5 font-mono', bg, color,
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      )}>
      <span className="flex gap-px">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn('w-1 rounded-sm', size === 'md' ? 'h-2.5' : 'h-2',
              i < bar ? 'opacity-100' : 'opacity-20'
            )}
            style={{ background: 'currentColor' }}
          />
        ))}
      </span>
      {showLabel && <span>{label}</span>}
      <span>{score}</span>
    </span>
  )
}
