import { AppShell } from '../../shared/components/AppShell'
import { MainMenu } from '../components/MainMenu'

export function ConsolePage() {
  return (
    <AppShell surface="Console">
      <section
        aria-labelledby="console-heading"
        className="w-full max-w-7xl"
      >
        <h1 id="console-heading" className="mb-8 text-3xl font-bold sm:text-4xl">
          Main menu
        </h1>
        <MainMenu />
      </section>
    </AppShell>
  )
}
