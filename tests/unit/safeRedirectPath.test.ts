import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from '@utils/safeRedirectPath'

describe('safeRedirectPath', () => {
  it('returns internal paths', () => {
    expect(safeRedirectPath('/budget-visualizer/transactions')).toBe('/budget-visualizer/transactions')
  })

  it('rejects protocol-relative and external URLs', () => {
    expect(safeRedirectPath('//evil.com')).toBeUndefined()
    expect(safeRedirectPath('https://evil.com')).toBeUndefined()
    expect(safeRedirectPath('javascript:alert(1)')).toBeUndefined()
  })

  it('rejects non-strings and empty', () => {
    expect(safeRedirectPath(null)).toBeUndefined()
    expect(safeRedirectPath('')).toBeUndefined()
    expect(safeRedirectPath('   ')).toBeUndefined()
  })
})
