import { AppShell } from '../../shared/components/AppShell'

export function ControllerPage() {
  return (
    <AppShell surface="Controller">
      <section aria-labelledby="controller-heading">
        <h1 id="controller-heading">Controller ready</h1>
        <p>Connect to a console to start playing.</p>
      </section>
    </AppShell>
  )
}
