import { render, screen, fireEvent } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { describe, expect, it } from 'vitest'
import TableComponent from '@components/shared/TableComponent'

function renderInRoute(ui: () => import('solid-js').JSX.Element) {
  return render(() => (
    <MemoryRouter root={(props) => props.children}>
      <Route path="/" component={() => ui()} />
    </MemoryRouter>
  ))
}

describe('TableComponent', () => {
  const columns = [
    { prop: 'name', label: 'Name' },
    { prop: 'amount', label: 'Amount' },
  ]
  const data = [
    { name: 'Groceries', amount: '50' },
    { name: 'Rent', amount: '1200' },
    { name: 'Gas', amount: '40' },
  ]

  it('renders column headers', () => {
    renderInRoute(() => <TableComponent tableData={data} columns={columns} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('renders row data', () => {
    renderInRoute(() => <TableComponent tableData={data} columns={columns} />)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('1200')).toBeInTheDocument()
  })

  it('applies formatter to cell values', () => {
    const cols = [
      { prop: 'name', label: 'Name' },
      { prop: 'amount', label: 'Amount', formatter: (v: string) => `$${v}` },
    ]
    renderInRoute(() => <TableComponent tableData={data} columns={cols} />)
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('$1200')).toBeInTheDocument()
  })

  it('sorts ascending then descending on sortable column click', () => {
    const { container } = renderInRoute(() => (
      <TableComponent tableData={data} columns={columns} sortableColumns={['amount']} />
    ))
    const amountHeader = screen.getByText(/Amount/)
    // Click to sort ascending
    fireEvent.click(amountHeader)
    let cells = container.querySelectorAll('tbody tr td:nth-child(2)')
    expect(cells[0]?.textContent).toBe('40')
    expect(cells[2]?.textContent).toBe('1200')

    // Click again to sort descending
    fireEvent.click(amountHeader)
    cells = container.querySelectorAll('tbody tr td:nth-child(2)')
    expect(cells[0]?.textContent).toBe('1200')
    expect(cells[2]?.textContent).toBe('40')
  })

  it('does not sort non-sortable columns', () => {
    const { container } = renderInRoute(() => (
      <TableComponent tableData={data} columns={columns} sortableColumns={['amount']} />
    ))
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    const cells = container.querySelectorAll('tbody tr td:first-child')
    expect(cells[0]?.textContent).toBe('Groceries')
  })

  it('renders nothing when tableData is empty', () => {
    const { container } = renderInRoute(() => <TableComponent tableData={[]} columns={columns} />)
    expect(container.querySelector('table')).toBeNull()
  })

  it('applies data-testid', () => {
    renderInRoute(() => <TableComponent tableData={data} columns={columns} dataTestId="my-table" />)
    expect(screen.getByTestId('my-table')).toBeInTheDocument()
  })

  it('renders router links when routerLinkColumn is provided', () => {
    renderInRoute(() => (
      <TableComponent tableData={data} columns={columns} routerLinkColumn={{ name: '/items' }} />
    ))
    const link = screen.getByText('Groceries').closest('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/items/Groceries')
  })
})
