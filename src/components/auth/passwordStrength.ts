export type StrengthLevel = 'none' | 'weak' | 'fair' | 'strong'

export interface Strength {
  score: 0 | 1 | 2 | 3
  level: StrengthLevel
  label: string
  checks: {
    length: boolean
    upper: boolean
    number: boolean
    symbol: boolean
  }
}

export function analyzePassword(pw: string): Strength {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
  if (!pw) return { score: 0, level: 'none', label: '', checks }
  const n = Object.values(checks).filter(Boolean).length
  if (n <= 2) return { score: 1, level: 'weak', label: 'Weak', checks }
  if (n <= 3) return { score: 2, level: 'fair', label: 'Fair', checks }
  return { score: 3, level: 'strong', label: 'Strong', checks }
}

export const REQUIREMENTS: { key: keyof Strength['checks']; label: string }[] = [
  { key: 'length', label: '8+ characters' },
  { key: 'upper', label: 'Uppercase (A\u2013Z)' },
  { key: 'number', label: 'Number (0\u20139)' },
  { key: 'symbol', label: 'Symbol (!@#\u2026)' },
]

export const SEG_COLORS: Record<StrengthLevel, string> = {
  weak: 'bg-destructive',
  fair: 'bg-amber-500',
  strong: 'bg-emerald-500',
  none: '',
}

export const LABEL_COLORS: Record<StrengthLevel, string> = {
  weak: 'text-destructive',
  fair: 'text-amber-600 dark:text-amber-400',
  strong: 'text-emerald-600 dark:text-emerald-400',
  none: '',
}
