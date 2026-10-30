import { createSignal } from 'solid-js'
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@api/queryKeys'
import type { Memo, MemoUpdateInput, RecurringSeries } from '@types'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'
import { makeRecurringSeries as makeSeries } from '../setup/makeRecurringSeries'

const monthlyAmountSpy = vi.hoisted(() => vi.fn<(s: RecurringSeries) => number>())
const updateSeriesMock = vi.fn<(id: number, dismissed: boolean) => Promise<RecurringSeries>>()
const updateMemoMock = vi.fn<(memo: MemoUpdateInput) => Promise<Memo>>()

vi.mock('@api/recurring/updateRecurringSeries', () => ({
  updateRecurringSeries: (id: number, dismissed: boolean) => updateSeriesMock(id, dismissed),
}))
vi.mock('@api/memos/updateMemo', () => ({
  updateMemo: (memo: MemoUpdateInput) => updateMemoMock(memo),
}))

// Real derived-data module, except `monthlyAmount`, which a test can override with a sentinel.
vi.mock('@components/recurring/createRecurringDerivedData', async (importActual) => {
  const actual = await importActual<typeof import('@components/recurring/createRecurringDerivedData')>()
  monthlyAmountSpy.mockImplementation(actual.monthlyAmount)
  return { ...actual, monthlyAmount: (s: RecurringSeries) => monthlyAmountSpy(s) }
})

const derived = await vi.importActual<typeof import('@components/recurring/createRecurringDerivedData')>(
  '@components/recurring/createRecurringDerivedData',
)
const { default: RecurringAvatar } = await import('@components/recurring/RecurringAvatar')
const { default: RecurringTriageLane } = await import('@components/recurring/RecurringTriageLane')

const TODAY = '2026-10-20'
const priceUp = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({
    memoName: 'Netflix',
    latestAmount: 15.99,
    monthlyNormalized: 15.99,
    amountHistory: [
      { date: '2026-09-15', amount: 12.99 },
      { date: '2026-10-15', amount: 15.99 },
    ],
    ...o,
  })
const priceDown = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({
    memoName: 'Spotify',
    latestAmount: 9.99,
    monthlyNormalized: 9.99,
    amountHistory: [
      { date: '2026-09-15', amount: 11.99 },
      { date: '2026-10-15', amount: 9.99 },
    ],
    ...o,
  })
const late = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({ memoName: 'Gym', status: 'overdue', nextExpectedDate: '2026-10-10', ...o })
const stopped = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({
    memoName: 'Hulu',
    status: 'stopped',
    lastDate: '2026-07-15',
    nextExpectedDate: '2026-08-15',
    ...o,
  })
const cadenceConflict = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({ memoName: 'Insurance', cadence: 'monthly', memoFrequency: 'yearly', ...o })
const flagConflict = (o: Partial<RecurringSeries> = {}) =>
  makeSeries({ memoName: 'Rent', memoRecurring: false, ...o })

function renderLane(series: RecurringSeries[], today = TODAY) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  // A router is part of the real app; the nameless-memo hint links to the memo's page.
  const view = render(() => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Route path="*" component={() => <RecurringTriageLane series={series} today={today} />} />
      </MemoryRouter>
    </QueryClientProvider>
  ))
  return { invalidate, ...view }
}

const card = (s: RecurringSeries) => screen.getByTestId(`recurring-triage-card-${s.id}`)

/** The `border-l-*` colour tokens on an element (the width utility `border-l-4` is not a colour). */
const stripeTokens = (el: HTMLElement) =>
  [...el.classList].filter((c) => c.startsWith('border-l-') && !/^border-l-\d/.test(c))

beforeEach(() => {
  updateSeriesMock.mockReset()
  updateMemoMock.mockReset()
  updateSeriesMock.mockResolvedValue({} as RecurringSeries)
  updateMemoMock.mockResolvedValue({} as Memo)
  monthlyAmountSpy.mockReset()
  monthlyAmountSpy.mockImplementation(derived.monthlyAmount)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('RecurringAvatar', () => {
  const avatar = () => screen.getByTestId('recurring-avatar')

  it('renders memo initials when avatarS3Url is null', () => {
    render(() => <RecurringAvatar memoName="Net Flix" avatarS3Url={null} />)
    expect(avatar()).toHaveTextContent('NF')
    expect(avatar().querySelector('img')).toBeNull()
  })

  it('takes the first two letters of a single-word name', () => {
    render(() => <RecurringAvatar memoName="netflix" avatarS3Url={null} />)
    expect(avatar()).toHaveTextContent('NE')
  })

  it('is a 28px circle on the muted token', () => {
    render(() => <RecurringAvatar memoName="Netflix" avatarS3Url={null} />)
    expect(avatar()).toHaveClass('size-7', 'rounded-full', 'bg-muted')
  })

  it('renders initials rather than a broken image when the avatar request fails', () => {
    // avatar URLs currently 403; initials are the designed default
    render(() => <RecurringAvatar memoName="Net Flix" avatarS3Url="https://bucket.example/a.png" />)
    const img = avatar().querySelector('img')!
    expect(img).toHaveAttribute('src', 'https://bucket.example/a.png')

    fireEvent.error(img)

    expect(avatar().querySelector('img')).toBeNull()
    expect(avatar()).toHaveTextContent('NF')
    // Same element, same size: nothing to shift.
    expect(avatar()).toHaveClass('size-7', 'rounded-full', 'bg-muted')
  })

  it('shows the initials while the image is still loading, then the image once it has loaded', () => {
    render(() => <RecurringAvatar memoName="Net Flix" avatarS3Url="https://bucket.example/a.png" />)
    const img = avatar().querySelector('img')!
    expect(avatar()).toHaveTextContent('NF')
    expect(img).toHaveClass('opacity-0')

    fireEvent.load(img)

    expect(img).not.toHaveClass('opacity-0')
    expect(avatar()).not.toHaveTextContent('NF')
  })

  it('forgets a failure when the url changes', () => {
    const [url, setUrl] = createSignal('https://bucket.example/a.png')
    render(() => <RecurringAvatar memoName="Net Flix" avatarS3Url={url()} />)
    fireEvent.error(avatar().querySelector('img')!)
    expect(avatar().querySelector('img')).toBeNull()

    setUrl('https://bucket.example/b.png')

    expect(avatar().querySelector('img')).toHaveAttribute('src', 'https://bucket.example/b.png')
  })

  it.each([
    ['null', null],
    ['empty', ''],
    ['whitespace', '   '],
    ['punctuation only', '!!!'],
  ])('renders a placeholder initial rather than crashing for a %s name', (_label, name) => {
    render(() => <RecurringAvatar memoName={name} avatarS3Url={null} />)
    expect(avatar()).toHaveTextContent('?')
  })

  it('does not split an astral character in half', () => {
    render(() => <RecurringAvatar memoName={'\u{1D4D0}\u{1D4D1}'} avatarS3Url={null} />)
    expect(avatar().textContent).toBe('\u{1D4D0}\u{1D4D1}')
  })
})

describe('RecurringTriageLane', () => {
  it('renders one card per series needing review', () => {
    const list = [priceUp(), priceDown(), late(), cadenceConflict(), stopped(), makeSeries()]
    renderLane(list)
    expect(screen.getAllByTestId(/^recurring-triage-card-/)).toHaveLength(5)
    expect(screen.queryByTestId(`recurring-triage-card-${list[5].id}`)).toBeNull()
    expect(screen.getByRole('heading', { name: /needs review/i })).toBeInTheDocument()
  })

  it('omits stopped series older than two cadences', () => {
    // Monthly: crossed into stopped 2 cadences past the expected date, lingers 2 more (~122 days).
    const recent = stopped({ nextExpectedDate: '2026-09-01' }) // 49 days past
    const old = stopped({ nextExpectedDate: '2026-04-15' }) // 188 days past
    renderLane([recent, old])
    expect(card(recent)).toBeInTheDocument()
    expect(screen.queryByTestId(`recurring-triage-card-${old.id}`)).toBeNull()
  })

  it('never shows a dismissed series', () => {
    const dismissed = priceUp({ dismissedAt: '2026-10-19T08:30:00.000Z' })
    renderLane([dismissed])
    expect(screen.queryByTestId(`recurring-triage-card-${dismissed.id}`)).toBeNull()
  })

  it('renders nothing when no series needs review', () => {
    const { container } = renderLane([makeSeries(), makeSeries()])
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByTestId('recurring-triage-lane')).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('renders nothing for an empty list', () => {
    const { container } = renderLane([])
    expect(container.textContent).toBe('')
  })

  it('takes today as a prop: the same stopped series ages out as the date moves on', () => {
    const s = stopped({ nextExpectedDate: '2026-09-01' })
    const near = renderLane([s], '2026-10-20')
    expect(screen.queryByTestId(`recurring-triage-card-${s.id}`)).not.toBeNull()
    near.unmount()
    renderLane([s], '2027-03-01')
    expect(screen.queryByTestId(`recurring-triage-card-${s.id}`)).toBeNull()
  })

  describe('form as well as text', () => {
    it.each([
      ['price-up', priceUp, 'border-l-negative', 'Price up'],
      ['price-down', priceDown, 'border-l-positive', 'Price down'],
      ['late', late, 'border-l-caution', 'Late'],
      ['conflict', cadenceConflict, 'border-l-accent-purple', 'Conflict'],
      ['stopped', stopped, 'border-l-positive', 'Stopped'],
    ] as const)('%s carries exactly its stripe token and badge', (state, make, stripe, badgeText) => {
      const s = make()
      renderLane([s])
      const el = card(s)
      expect(el).toHaveAttribute('data-state', state)
      expect(el).toHaveClass('border-l-4')
      expect(stripeTokens(el)).toEqual([stripe])
      expect(within(el).getByTestId('recurring-triage-badge')).toHaveTextContent(badgeText)
    })

    it('tints each badge with its own muted background and matching text token', () => {
      const list = [priceUp(), priceDown(), late(), cadenceConflict(), stopped()]
      renderLane(list)
      const expected = [
        ['bg-negative-muted', 'text-negative-emphasis'],
        ['bg-positive-muted', 'text-positive-emphasis'],
        ['bg-caution-muted', 'text-caution-on-muted'],
        ['bg-accent-purple-muted', 'text-accent-purple-foreground'],
        ['bg-positive-muted', 'text-positive-emphasis'],
      ]
      list.forEach((s, i) => {
        const classes = within(card(s)).getByTestId('recurring-triage-badge').className.split(/\s+/)
        expect(classes).toContain(expected[i][0])
        expect(classes).toContain(expected[i][1])
      })
    })

    it('keeps price-down and stopped apart by badge text and icon although they share a stripe', () => {
      const down = priceDown()
      const stop = stopped()
      renderLane([down, stop])
      expect(stripeTokens(card(down))).toEqual(stripeTokens(card(stop)))
      const text = (s: RecurringSeries) => within(card(s)).getByTestId('recurring-triage-badge').textContent
      const icon = (s: RecurringSeries) =>
        within(card(s)).getByTestId('recurring-triage-icon').getAttribute('data-icon')
      expect(text(down)).not.toEqual(text(stop))
      expect(icon(down)).toBeTruthy()
      expect(icon(stop)).toBeTruthy()
      expect(icon(down)).not.toEqual(icon(stop))
    })

    it('carries no literal colour in any state', () => {
      const { container } = renderLane([
        priceUp(),
        priceDown(),
        late(),
        cadenceConflict(),
        flagConflict(),
        stopped(),
      ])
      expectNoLiteralColours(container.innerHTML)
    })
  })

  describe('card content', () => {
    it('shows the avatar, memo name and the monthly figure', () => {
      const s = priceUp({ monthlyNormalized: 1234.5 })
      renderLane([s])
      const el = card(s)
      expect(within(el).getByTestId('recurring-avatar')).toHaveTextContent('NE')
      expect(within(el).getByText('Netflix')).toBeInTheDocument()
      expect(within(el).getByTestId('recurring-triage-monthly')).toHaveTextContent('$1,234.50/mo')
    })

    it('takes the monthly figure from monthlyAmount, not from monthlyNormalized', () => {
      monthlyAmountSpy.mockReturnValue(42.42)
      const s = priceUp({ monthlyNormalized: 15.99 })
      renderLane([s])
      expect(within(card(s)).getByTestId('recurring-triage-monthly')).toHaveTextContent('$42.42/mo')
    })

    it('falls back to a readable name for a memo with no name', () => {
      const s = priceUp({ memoName: null })
      renderLane([s])
      expect(within(card(s)).getByText('Unnamed memo')).toBeInTheDocument()
      expect(within(card(s)).getByTestId('recurring-avatar')).toHaveTextContent('?')
    })

    it.each([
      ['price-up', () => priceUp(), 'Charge rose from $12.99 to $15.99'],
      ['price-down', () => priceDown(), 'Charge fell from $11.99 to $9.99'],
      ['late', () => late(), 'Payment was due 10 Oct and has not arrived'],
      ['late (no date)', () => late({ nextExpectedDate: null }), 'Payment is overdue'],
      ['stopped', () => stopped(), 'No payment since 15 Jul'],
      ['conflict (cadence)', () => cadenceConflict(), 'Detected as monthly, but the memo says yearly'],
      [
        'conflict (flag)',
        () => flagConflict(),
        'Detected as recurring, but the memo is marked not recurring',
      ],
    ])('gives a one-line reason for %s', (_label, make, reason) => {
      const s = make()
      renderLane([s])
      expect(within(card(s)).getByTestId('recurring-triage-reason')).toHaveTextContent(reason)
    })

    it('judges a price step from dates, not from array order', () => {
      const s = priceUp({
        amountHistory: [
          { date: '2026-10-15', amount: 15.99 },
          { date: '2026-09-15', amount: 12.99 },
        ],
      })
      renderLane([s])
      expect(within(card(s)).getByTestId('recurring-triage-reason')).toHaveTextContent(
        'Charge rose from $12.99 to $15.99',
      )
    })
  })

  describe('as of last scan', () => {
    it.each([
      ['late', () => late()],
      ['stopped', () => stopped()],
    ])('qualifies a %s card as a last-scan snapshot', (_label, make) => {
      const s = make()
      renderLane([s])
      const caption = within(card(s)).getByTestId('recurring-triage-as-of-scan')
      expect(caption).toHaveTextContent(/as of last scan/i)
      expect(caption).toHaveAttribute('title', 'Status from the last scan. Rescan to refresh it.')
    })
  })

  describe('dismiss', () => {
    it('calls updateRecurringSeries with dismissed=true when Dismiss is clicked', async () => {
      const s = priceUp()
      const { invalidate } = renderLane([s])
      fireEvent.click(within(card(s)).getByRole('button', { name: /dismiss/i }))
      await waitFor(() => expect(updateSeriesMock).toHaveBeenCalledWith(s.id, true))
      expect(updateMemoMock).not.toHaveBeenCalled()
      await waitFor(() =>
        expect(invalidate).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: queryKeys.recurring.all }),
        ),
      )
    })

    it('offers Dismiss on late and stopped cards too', () => {
      const l = late()
      const st = stopped()
      renderLane([l, st])
      expect(within(card(l)).getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
      expect(within(card(st)).getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('reports a failure and lets the user retry', async () => {
      updateSeriesMock.mockRejectedValueOnce(new Error('boom'))
      const s = priceUp()
      const { invalidate } = renderLane([s])
      const button = within(card(s)).getByRole('button', { name: /dismiss/i })
      fireEvent.click(button)
      expect(await within(card(s)).findByRole('alert')).toHaveTextContent('boom')
      expect(button).not.toBeDisabled()
      expect(invalidate).not.toHaveBeenCalled()
    })
  })

  describe('conflict card', () => {
    it('offers Set monthly / Keep yearly on a cadence conflict', () => {
      const s = cadenceConflict()
      renderLane([s])
      expect(within(card(s)).getByRole('button', { name: 'Set monthly' })).toBeInTheDocument()
      expect(within(card(s)).getByRole('button', { name: 'Keep yearly' })).toBeInTheDocument()
      expect(within(card(s)).queryByRole('button', { name: /^dismiss$/i })).toBeNull()
    })

    it('offers Mark recurring / Keep not recurring when only the recurring flag disagrees', () => {
      const s = flagConflict()
      renderLane([s])
      expect(within(card(s)).getByRole('button', { name: 'Mark recurring' })).toBeInTheDocument()
      expect(within(card(s)).getByRole('button', { name: 'Keep not recurring' })).toBeInTheDocument()
    })

    it('writes the memo through the existing memo mutation, never a recurring endpoint', async () => {
      const s = cadenceConflict({ memoId: 77, memoName: 'Insurance' })
      const { invalidate } = renderLane([s])
      fireEvent.click(within(card(s)).getByRole('button', { name: 'Set monthly' }))

      await waitFor(() => expect(updateMemoMock).toHaveBeenCalledTimes(1))
      expect(updateMemoMock).toHaveBeenCalledWith({
        id: 77,
        name: 'Insurance',
        recurring: true,
        frequency: 'monthly',
      })
      expect(updateSeriesMock).not.toHaveBeenCalled()
      await waitFor(() => {
        const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
        expect(keys).toContainEqual(queryKeys.recurring.all)
        expect(keys).toContainEqual(queryKeys.memos.all)
      })
    })

    it('marks the memo recurring at the detected cadence when only the flag disagrees', async () => {
      const s = flagConflict({ memoId: 88, memoName: 'Rent', cadence: 'monthly', memoFrequency: 'monthly' })
      renderLane([s])
      fireEvent.click(within(card(s)).getByRole('button', { name: 'Mark recurring' }))
      await waitFor(() =>
        expect(updateMemoMock).toHaveBeenCalledWith({
          id: 88,
          name: 'Rent',
          recurring: true,
          frequency: 'monthly',
        }),
      )
    })

    it('treats Keep as a dismissal: the memo is untouched, the detection is set aside', async () => {
      const s = cadenceConflict()
      const { invalidate } = renderLane([s])
      fireEvent.click(within(card(s)).getByRole('button', { name: 'Keep yearly' }))
      await waitFor(() => expect(updateSeriesMock).toHaveBeenCalledWith(s.id, true))
      expect(updateMemoMock).not.toHaveBeenCalled()
      await waitFor(() =>
        expect(invalidate).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: queryKeys.recurring.all }),
        ),
      )
    })

    it('cannot write a memo that has no name, and says why', () => {
      const s = cadenceConflict({ memoName: null })
      renderLane([s])
      const accept = within(card(s)).getByRole('button', { name: 'Set monthly' })
      expect(accept).toBeDisabled()
      expect(within(card(s)).getByTestId('recurring-triage-needs-name')).toBeInTheDocument()
      fireEvent.click(accept)
      expect(updateMemoMock).not.toHaveBeenCalled()
    })

    it('says what Keep does and does not change', () => {
      const s = cadenceConflict()
      renderLane([s])
      const hint = within(card(s)).getByTestId('recurring-triage-keep-hint')
      expect(hint).toHaveTextContent(/stops flagging this series/i)
      expect(hint).toHaveTextContent(/still counts toward your monthly total/i)
    })

    it('does not show the Keep hint on other cards', () => {
      const s = priceUp()
      renderLane([s])
      expect(within(card(s)).queryByTestId('recurring-triage-keep-hint')).toBeNull()
    })

    it('links a nameless memo to its memo page', () => {
      const s = cadenceConflict({ memoName: null, memoId: 321 })
      renderLane([s])
      expect(within(card(s)).getByTestId('recurring-triage-name-link')).toHaveAttribute(
        'href',
        '/budget-visualizer/memos/321/edit',
      )
    })

    it('reports a failed memo write', async () => {
      updateMemoMock.mockRejectedValueOnce(new Error('memo boom'))
      const s = cadenceConflict()
      renderLane([s])
      fireEvent.click(within(card(s)).getByRole('button', { name: 'Set monthly' }))
      expect(await within(card(s)).findByRole('alert')).toHaveTextContent('memo boom')
    })
  })
})

describe('RecurringTriageLane while a write is in flight', () => {
  /** A promise the test settles by hand, so the mutation stays pending. */
  function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => {
      resolve = r
    })
    return { promise, resolve }
  }

  it('disables Dismiss once it is clicked, so a second click cannot send a second PATCH', async () => {
    const pending = deferred<RecurringSeries>()
    updateSeriesMock.mockReturnValue(pending.promise)
    const s = priceUp()
    renderLane([s])
    const button = within(card(s)).getByRole('button', { name: /dismiss/i })

    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    fireEvent.click(button)

    expect(updateSeriesMock).toHaveBeenCalledTimes(1)
    pending.resolve({} as RecurringSeries)
  })

  it('disables both conflict buttons while the memo write is pending', async () => {
    const pending = deferred<Memo>()
    updateMemoMock.mockReturnValue(pending.promise)
    const s = cadenceConflict()
    renderLane([s])
    const accept = within(card(s)).getByRole('button', { name: 'Set monthly' })
    const keep = within(card(s)).getByRole('button', { name: 'Keep yearly' })

    fireEvent.click(accept)
    await waitFor(() => expect(accept).toBeDisabled())
    expect(keep).toBeDisabled()
    fireEvent.click(accept)
    fireEvent.click(keep)

    expect(updateMemoMock).toHaveBeenCalledTimes(1)
    expect(updateSeriesMock).not.toHaveBeenCalled()
    pending.resolve({} as Memo)
  })

  it('disables both conflict buttons while Keep is pending', async () => {
    const pending = deferred<RecurringSeries>()
    updateSeriesMock.mockReturnValue(pending.promise)
    const s = cadenceConflict()
    renderLane([s])
    const accept = within(card(s)).getByRole('button', { name: 'Set monthly' })
    const keep = within(card(s)).getByRole('button', { name: 'Keep yearly' })

    fireEvent.click(keep)
    await waitFor(() => expect(keep).toBeDisabled())
    expect(accept).toBeDisabled()
    fireEvent.click(keep)
    fireEvent.click(accept)

    expect(updateSeriesMock).toHaveBeenCalledTimes(1)
    expect(updateMemoMock).not.toHaveBeenCalled()
    pending.resolve({} as RecurringSeries)
  })
})
