import type { JSX } from 'solid-js'
import NavigationButtonGroup from './NavigationButtonGroup'

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
      class="flex w-full items-center justify-between text-foreground"
      data-testid={`${testBase()}-header`}
      data-selected-period={props.selectedPeriod}
      data-timeframe={tf()}
    >
      <div class="flex items-center gap-8" data-testid={`${testBase()}-left-section`}>
        <div
          class="flex gap-2"
          classList={{
            'flex-row items-center gap-10': tf() === 'Month',
            'flex-col gap-0.5': tf() === 'Week',
          }}
        >
          <h2 data-testid={`${testBase()}-title`}>
            {tf()} Summary for: {props.selectedPeriod}
          </h2>
          {props.subtitle}
        </div>
        {props.amountTotal}
      </div>
      <div class="flex items-start">
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
