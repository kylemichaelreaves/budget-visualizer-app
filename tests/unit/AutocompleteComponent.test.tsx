import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'

describe('AutocompleteComponent', () => {
  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ]

  it('renders with placeholder', () => {
    render(() => (
      <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Search fruit" />
    ))
    expect(screen.getByPlaceholderText('Search fruit')).toBeInTheDocument()
  })

  /**
   * The reason this component was moved onto Kobalte. The hand-rolled version
   * rendered `<div role="option">` rows with none of this wiring, so assistive
   * technology could not tell a listbox existed or which row was current.
   */
  describe('combobox accessibility wiring', () => {
    it('advertises itself as a combobox that controls a listbox', () => {
      render(() => (
        <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />
      ))
      const input = screen.getByRole('combobox')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      fireEvent.focus(input)
      expect(input).toHaveAttribute('aria-expanded', 'true')
      expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
    })

    it('tracks the highlighted option via aria-activedescendant as the user arrows', () => {
      render(() => (
        <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />
      ))
      const input = screen.getByRole('combobox')
      fireEvent.focus(input)
      expect(input).not.toHaveAttribute('aria-activedescendant')

      fireEvent.keyDown(input, { key: 'ArrowDown' })
      const active = input.getAttribute('aria-activedescendant')
      expect(active).toBeTruthy()
      // It names a real option element, not a stale or invented id.
      expect(screen.getAllByRole('option').some((o) => o.id === active)).toBe(true)
    })

    it('gives every row the option role with a selected state', () => {
      render(() => (
        <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />
      ))
      fireEvent.focus(screen.getByRole('combobox'))
      const rows = screen.getAllByRole('option')
      expect(rows).toHaveLength(options.length)
      for (const row of rows) {
        expect(row).toHaveAttribute('aria-selected')
      }
    })
  })

  it('shows dropdown on focus', () => {
    render(() => <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />)
    fireEvent.focus(screen.getByPlaceholderText('Fruit'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('displays all options on focus when query is empty', () => {
    render(() => <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />)
    fireEvent.focus(screen.getByPlaceholderText('Fruit'))
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('filters suggestions based on input', () => {
    render(() => <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />)
    const input = screen.getByPlaceholderText('Fruit')
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: 'ban' } })
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn()
    render(() => <AutocompleteComponent value="" onChange={onChange} options={options} placeholder="Fruit" />)
    fireEvent.focus(screen.getByPlaceholderText('Fruit'))
    fireEvent.click(screen.getByText('Banana'))
    expect(onChange).toHaveBeenCalledWith('banana')
  })

  it('shows clear button when value is set', () => {
    render(() => (
      <AutocompleteComponent value="apple" onChange={() => {}} options={options} placeholder="Fruit" />
    ))
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })

  it('calls onChange with empty string and onClear on clear click', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    render(() => (
      <AutocompleteComponent
        value="apple"
        onChange={onChange}
        onClear={onClear}
        options={options}
        placeholder="Fruit"
      />
    ))
    fireEvent.click(screen.getByLabelText('Clear'))
    expect(onChange).toHaveBeenCalledWith('')
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('does not show dropdown when disabled', () => {
    render(() => (
      <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" disabled />
    ))
    fireEvent.focus(screen.getByPlaceholderText('Fruit'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects option on Enter key', () => {
    const onChange = vi.fn()
    render(() => <AutocompleteComponent value="" onChange={onChange} options={options} placeholder="Fruit" />)
    const input = screen.getByPlaceholderText('Fruit')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('apple') // first option
  })

  it('closes dropdown on Escape key', () => {
    render(() => <AutocompleteComponent value="" onChange={() => {}} options={options} placeholder="Fruit" />)
    const input = screen.getByPlaceholderText('Fruit')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
