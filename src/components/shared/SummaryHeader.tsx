import type { JSX } from 'solid-js'
import NavigationButtonGroup from './NavigationButtonGroup'
import './shared-ui.css'

export default function SummaryHeader(props: {
  timeFrame: 'Month' | 'Week'
  selectedPeriod: string
  isFirst: boolean
  isLast: boolean
  goToNext: () => void
  goToPrevious: () => void
  reset: () => void
  subtitle?: JSX.Element
  amountTotal?: JSX.Element
}): JSX.Element {
  const tf = () => props.timeFrame
  const testBase = () => `${tf().toLowerCase()}-summary`

  return (
    <div
      class="bv-summary-header"
      data-testid={`${testBase()}-header`}
      data-selected-period={props.selectedPeriod}
      data-timeframe={tf()}
    >
      <div class="bv-summary-header-left" data-testid={`${testBase()}-left-section`}>
        <div class="bv-summary-title-section">
          <h2 data-testid={`${testBase()}-title`}>
            {tf()} Summary for: {props.selectedPeriod}
          </h2>
          {props.subtitle}
        </div>
        {props.amountTotal}
      </div>
      <div class="bv-summary-header-right">
        <NavigationButtonGroup
          label={tf()}
          isLast={props.isLast}
          isFirst={props.isFirst}
          goToNext={props.goToNext}
          goToPrevious={props.goToPrevious}
          reset={props.reset}
          dataTestId={`${testBase()}-navigation-button-group`}
          aria-label="Navigation Button Group"
        />
      </div>
    </div>
  )
}
