export function SignInInsteadFooter(props: { href: string }) {
  return (
    <p class="text-center text-sm text-muted-foreground">
      Already have an account?{' '}
      <a href={props.href} class="text-primary hover:underline font-medium">
        Sign in
      </a>
    </p>
  )
}
