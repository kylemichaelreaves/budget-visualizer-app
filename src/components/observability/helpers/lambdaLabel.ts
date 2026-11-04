import type { LambdaKey } from '@types'

const LABELS: Record<LambdaKey, string> = {
  resourceQuerier: 'resourceQuerier',
  authorizer: 'Authorizer',
  userManager: 'UserManager',
  ingestion: 'CSV ingestion',
}

/** Friendly name for a Lambda; the physical function name is shown separately. */
export function lambdaLabel(key: LambdaKey): string {
  return LABELS[key]
}
