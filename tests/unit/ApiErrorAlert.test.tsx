import { render, screen } from '@solidjs/testing-library'
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'

// #91: a 4xx used to render as title "AxiosError" with Axios's status line as the
// body, dropping the server's explanation.

function conflict(message: string) {
  return new AxiosError('Request failed with status code 409', '409', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('ApiErrorAlert', () => {
  it("titles the alert with the caller's title and shows the server's message", () => {
    render(() => (
      <ApiErrorAlert error={conflict('Memo name already taken')} title="Could not save memo" dataTestId="e" />
    ))
    expect(screen.getByTestId('e')).toHaveTextContent('Could not save memo')
    expect(screen.getByTestId('e-message')).toHaveTextContent('Memo name already taken')
    expect(screen.getByTestId('e')).not.toHaveTextContent('AxiosError')
  })

  it('falls back to the error message, and copes with a non-Error', () => {
    render(() => <ApiErrorAlert error={new Error('Network Error')} title="T" dataTestId="a" />)
    render(() => <ApiErrorAlert error={42} title="T" dataTestId="b" />)
    expect(screen.getByTestId('a-message')).toHaveTextContent('Network Error')
    expect(screen.getByTestId('b-message')).toHaveTextContent('An unexpected error occurred')
  })

  it.each([false, null, undefined])('renders nothing for %s', (error) => {
    render(() => <ApiErrorAlert error={error} title="T" dataTestId="none" />)
    expect(screen.queryByTestId('none')).toBeNull()
  })
})
