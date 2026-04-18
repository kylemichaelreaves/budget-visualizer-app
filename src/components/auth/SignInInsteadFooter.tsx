import { A } from '@solidjs/router'

export function SignInInsteadFooter(props: { href: string }) {
  return (
    <p class="text-center text-sm text-muted-foreground">
      Already have an account?{' '}
      <A href={props.href} class="text-primary hover:underline font-medium">
        Sign in
      </A>
    </p>
  )
}
