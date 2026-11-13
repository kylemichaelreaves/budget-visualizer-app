import { createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CONFIRM_MISMATCH_ERROR,
  CONFIRM_REQUIRED_ERROR,
  createNewPasswordFields,
} from '@components/auth/createNewPasswordFields'
import { newPasswordError } from '@components/auth/newPasswordError'

const STRONG = 'Correct-Horse-9'

let dispose: (() => void) | undefined

function mount() {
  return createRoot((d) => {
    dispose = d
    const [submitted, setSubmitted] = createSignal(false)
    return { f: createNewPasswordFields(submitted), setSubmitted }
  })
}

afterEach(() => {
  dispose?.()
  dispose = undefined
})

describe('createNewPasswordFields', () => {
  it('hides errors until submitted', () => {
    const { f, setSubmitted } = mount()
    f.setPassword('short')
    expect(f.pwError()).toBeNull()
    expect(f.cfError()).toBeNull()
    setSubmitted(true)
    expect(f.pwError()).toBe(newPasswordError('short'))
    expect(f.cfError()).toBe(CONFIRM_REQUIRED_ERROR)
  })

  it('reports a mismatch, then success once the pair matches', () => {
    const { f, setSubmitted } = mount()
    setSubmitted(true)
    f.setPassword(STRONG)
    f.setConfirm(`${STRONG}x`)
    expect(f.cfError()).toBe(CONFIRM_MISMATCH_ERROR)
    expect(f.cfSuccess()).toBe(false)
    f.setConfirm(STRONG)
    expect(f.cfError()).toBeNull()
    expect(f.cfSuccess()).toBe(true)
  })

  // The submit gate must not depend on `submitted`, or a handler that sets it
  // and checks in the same tick would read stale validity.
  it('gates submit independently of submitted', () => {
    const { f } = mount()
    expect(f.isValid()).toBe(false)
    f.setPassword(STRONG)
    expect(f.isValid()).toBe(false)
    f.setConfirm(STRONG)
    expect(f.isValid()).toBe(true)
    f.setPassword('weakpassword')
    f.setConfirm('weakpassword')
    expect(f.isValid()).toBe(false)
  })

  it('tracks strength and the show toggles, and reset clears them', () => {
    const { f } = mount()
    f.setPassword(STRONG)
    f.setConfirm(STRONG)
    f.toggleShowPw()
    f.toggleShowCf()
    expect(f.strength().score).toBeGreaterThanOrEqual(2)
    expect(f.showPw()).toBe(true)
    expect(f.showCf()).toBe(true)
    f.reset()
    expect([f.password(), f.confirm(), f.showPw(), f.showCf()]).toEqual(['', '', false, false])
  })
})
