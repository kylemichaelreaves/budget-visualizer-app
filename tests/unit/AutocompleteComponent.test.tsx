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
