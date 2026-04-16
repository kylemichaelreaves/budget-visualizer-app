import { A } from '@solidjs/router'
import { AlertCircle } from 'lucide-solid'
import { AuthIconHeading } from './AuthIconHeading'

export function MissingToken() {
  return (
    <div class="flex flex-col items-center text-center gap-5 px-1">
      <AuthIconHeading
        icon={AlertCircle}
        title="Missing reset token"
        hasError
        description={
          <>
            This page needs a <code class="text-foreground">?token=</code> parameter. Request a new link from{' '}
            <A href="/password/reset" class="text-primary underline underline-offset-2">
              Forgot password
            </A>
            .
          </>
        }
      />
    </div>
  )
}
