import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'
import { fakeQuery } from '../setup/fakeQuery'

const [query, setQuery] = fakeQuery<Memo[]>()
vi.mock('@api/hooks/memos/useMemoSearch', () => ({ useMemoSearch: () => query }))

type Option = { value: string; label: string }
let lastOptions: Option[] = []
let searchResults: Option[] | undefined
vi.mock('@components/shared/AutocompleteComponent', () => ({
  default: (props: {
    options: Option[]
    loading?: boolean
    onChange: (v: string) => void
    onSearch: (q: string, cb: (r: Option[]) => void) => void
    onInputBlur: () => void
    onEnterNoSuggestions: () => void
    onClear: () => void
  }) => {
    lastOptions = props.options
    return (
      <div data-testid="ac" data-loading={String(!!props.loading)} data-count={props.options.length}>
        <button data-testid="pick-7" onClick={() => props.onChange('m:7')} />
        <button data-testid="pick-missing" onClick={() => props.onChange('m:999')} />
        <button data-testid="type-unique" onClick={() => props.onChange('RENT')} />
        <button data-testid="type-dup" onClick={() => props.onChange('COFFEE')} />
        <button data-testid="search" onClick={() => props.onSearch('co', (r) => (searchResults = r))} />
        <button data-testid="blur" onClick={() => props.onInputBlur()} />
        <button data-testid="enter" onClick={() => props.onEnterNoSuggestions()} />
        <button data-testid="clear" onClick={() => props.onClear()} />
      </div>
    )
  },
}))

const { default: MemoSelect } = await import('@components/transactions/selects/MemoSelect')

const memos = [
  { id: 7, name: 'WHOLEFDS' },
  { id: 8, name: 'COFFEE' },
  { id: 9, name: 'COFFEE' },
  { id: 10, name: 'RENT' },
  { id: 11, name: '  ' },
] as Memo[]

function setup(value = '') {
  const onChange = vi.fn()
  const onCommit = vi.fn()
  render(() => <MemoSelect value={value} onChange={onChange} onCommit={onCommit} dataTestId="memo" />)
  return { onChange, onCommit }
}

describe('MemoSelect', () => {
  beforeEach(() => {
    searchResults = undefined
    setQuery({ data: memos, isPending: false, isError: false, error: null, isLoading: false })
  })

  it('labels duplicate names with their id and skips blank names', () => {
    setup()
    expect(lastOptions.map((o) => o.label)).toEqual(['WHOLEFDS', 'COFFEE (#8)', 'COFFEE (#9)', 'RENT'])
  })

  it('resolves a picked option to its memo name and id', () => {
    const { onChange } = setup()
    fireEvent.click(screen.getByTestId('pick-7'))
    expect(onChange).toHaveBeenCalledWith('WHOLEFDS', 7)
    fireEvent.click(screen.getByTestId('pick-missing'))
    expect(onChange).toHaveBeenLastCalledWith('999', 999)
  })

  it('attaches an id to typed text only when the name is unique', () => {
    const { onChange } = setup()
    fireEvent.click(screen.getByTestId('type-unique'))
    expect(onChange).toHaveBeenLastCalledWith('RENT', 10)
    fireEvent.click(screen.getByTestId('type-dup'))
    expect(onChange).toHaveBeenLastCalledWith('COFFEE', undefined)
  })

  it('commits the current value on blur and on Enter', () => {
    const { onCommit } = setup('  RENT ')
    fireEvent.click(screen.getByTestId('blur'))
    expect(onCommit).toHaveBeenLastCalledWith('RENT', 10)
    fireEvent.click(screen.getByTestId('enter'))
    expect(onCommit).toHaveBeenCalledTimes(2)
  })

  it('commits an empty value as a clear', () => {
    const { onCommit } = setup('')
    fireEvent.click(screen.getByTestId('blur'))
    expect(onCommit).toHaveBeenCalledWith('', undefined)
  })

  it('answers a search once results are loaded', () => {
    setQuery({ isLoading: true, isPending: true })
    setup()
    fireEvent.click(screen.getByTestId('search'))
    expect(searchResults).toBeUndefined()
    expect(screen.getByTestId('ac')).toHaveAttribute('data-loading', 'true')
    setQuery({ isLoading: false, isPending: false, data: memos.slice(0, 2) })
    expect(searchResults?.map((o) => o.label)).toEqual(['WHOLEFDS', 'COFFEE'])
  })

  it('drops a pending search on clear', () => {
    setQuery({ isLoading: true, isPending: true })
    setup()
    fireEvent.click(screen.getByTestId('search'))
    fireEvent.click(screen.getByTestId('clear'))
    setQuery({ isLoading: false, isPending: false, data: memos })
    expect(searchResults).toBeUndefined()
  })

  it('shows no options and an error when the search fails', () => {
    setQuery({ isPending: false, isError: true, error: new Error('boom'), data: undefined, dataUpdatedAt: 0 })
    setup()
    expect(screen.getByTestId('ac')).toHaveAttribute('data-count', '0')
    expect(screen.getByTestId('memo-error')).toBeInTheDocument()
  })
})
