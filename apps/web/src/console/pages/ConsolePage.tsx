import { AppShell } from '../../shared/components/AppShell'
import { ButtonRow } from '../components/focus_test'

export function ConsolePage() {
  return (
    <AppShell surface="Console">
      <section aria-labelledby="console-heading">
        <h1 id="console-heading">Console ready</h1>
        <ButtonRow />
      </section>
    </AppShell>
  )
}
