import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import StatisticComponent from '@components/shared/StatisticComponent'

describe('StatisticComponent', () => {
  it('renders title and value', () => {
    render(() => <StatisticComponent title="Total" value={500} dataTestId="stat" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('applies precision formatting', () => {
    render(() => <StatisticComponent title="Amount" value={99.5} precision={2} dataTestId="stat" />)
    expect(screen.getByText('99.50')).toBeInTheDocument()
  })

  it('shows Increase when value > previousValue', () => {
    render(() => <StatisticComponent title="Spent" value={200} previousValue={100} />)
    expect(screen.getByText('Increase')).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('shows Decrease when value < previousValue', () => {
    render(() => <StatisticComponent title="Spent" value={50} previousValue={100} />)
    expect(screen.getByText('Decrease')).toBeInTheDocument()
    expect(screen.getByText(/from last period/)).toHaveTextContent('50')
  })

  it('shows No Change when value equals previousValue', () => {
    render(() => <StatisticComponent title="Spent" value={100} previousValue={100} />)
    expect(screen.getByText('No Change')).toBeInTheDocument()
  })

  it('does not show comparison when previousValue is not provided', () => {
    render(() => <StatisticComponent title="Total" value={100} />)
    expect(screen.queryByText('Increase')).not.toBeInTheDocument()
    expect(screen.queryByText('Decrease')).not.toBeInTheDocument()
    expect(screen.queryByText('No Change')).not.toBeInTheDocument()
  })
})
