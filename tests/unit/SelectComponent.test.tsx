import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import SelectComponent from '@components/shared/SelectComponent'

describe('SelectComponent', () => {
  const options = [
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
  ]

  it('renders with placeholder', () => {
    render(() => (
      <SelectComponent options={options} selectedValue="" placeholder="Select year" onChange={() => {}} />
    ))
    expect(screen.getByPlaceholderText('Select year')).toBeInTheDocument()
  })

  it('shows selected label in input when closed', () => {
    render(() => (
      <SelectComponent options={options} selectedValue="2023" placeholder="Year" onChange={() => {}} />
    ))
    const input = screen.getByPlaceholderText('Year') as HTMLInputElement
    expect(input.value).toBe('2023')
  })

  it('opens dropdown on focus and shows options', () => {
    render(() => (
      <SelectComponent options={options} selectedValue="" placeholder="Year" onChange={() => {}} />
    ))
    fireEvent.focus(screen.getByPlaceholderText('Year'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByTestId('option-2024')).toBeInTheDocument()
    expect(screen.getByTestId('option-2023')).toBeInTheDocument()
  })

  it('calls onChange when an option is selected', () => {
    const onChange = vi.fn()
    render(() => (
      <SelectComponent options={options} selectedValue="" placeholder="Year" onChange={onChange} />
    ))
    fireEvent.focus(screen.getByPlaceholderText('Year'))
    fireEvent.click(screen.getByTestId('option-2023'))
    expect(onChange).toHaveBeenCalledWith('2023')
  })

  it('filters options when typing', () => {
    render(() => (
      <SelectComponent options={options} selectedValue="" placeholder="Year" onChange={() => {}} />
    ))
    const input = screen.getByPlaceholderText('Year')
    fireEvent.focus(input)
    fireEvent.input(input, { target: { value: '24' } })
    expect(screen.getByTestId('option-2024')).toBeInTheDocument()
    expect(screen.queryByTestId('option-2023')).not.toBeInTheDocument()
  })

  it('shows clear button when a value is selected', () => {
    render(() => (
      <SelectComponent options={options} selectedValue="2024" placeholder="Year" onChange={() => {}} />
    ))
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })

  it('does not show clear button when disabled', () => {
    render(() => (
      <SelectComponent
        options={options}
        selectedValue="2024"
        placeholder="Year"
        onChange={() => {}}
        disabled
      />
    ))
    expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument()
  })
})
