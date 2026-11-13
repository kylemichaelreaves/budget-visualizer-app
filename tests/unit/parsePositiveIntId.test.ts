import { describe, expect, it } from 'vitest'
import { parsePositiveIntId } from '@utils/parsePositiveIntId'
import { memoIdQueryParamInvalid } from '@composables/transactionFilterUrlHelpers'

describe('parsePositiveIntId', () => {
  it.each([
    [7, 7],
    ['7', 7],
    ['0042', 42],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])('accepts %j', (raw, expected) => {
    expect(parsePositiveIntId(raw)).toBe(expected)
  })

  // Each of these is a positive number to `Number()`, or close to it — the
  // reason a bare `Number(x) > 0` check let `/memos/1000` be fetched for `1e3`.
  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    '',
    '0',
    '-2',
    '1.5',
    '1e3',
    ' 7',
    '7 ',
    '0x10',
    null,
    undefined,
    true,
    {},
  ])('rejects %j', (raw) => {
    expect(parsePositiveIntId(raw)).toBeNull()
  })
})

describe('memoIdQueryParamInvalid agrees with parsePositiveIntId', () => {
  it('treats an absent param as valid (nothing to strip)', () => {
    expect(memoIdQueryParamInvalid(null)).toBe(false)
  })

  it.each(['', '0', '1.5', '1e3', '-3', 'abc', '7', '12'])('%j', (raw) => {
    expect(memoIdQueryParamInvalid(raw)).toBe(parsePositiveIntId(raw) == null)
  })
})
