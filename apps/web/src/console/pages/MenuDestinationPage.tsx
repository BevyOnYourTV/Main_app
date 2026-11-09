import { AppShell } from '../../shared/components/AppShell'
import { SpatialLinkButton } from '../components/SpatialLinkButton'

type MenuDestinationPageProps = {
  description: string
  title: string
}

export function MenuDestinationPage({
  description,
  title,
}: MenuDestinationPageProps) {
  return (
    <AppShell surface="Console">
      <section aria-labelledby="destination-heading" className="max-w-2xl">
        <h1 id="destination-heading" className="text-4xl font-bold">
          {title}
        </h1>
        <p className="mb-8 text-lg">{description}</p>
        <SpatialLinkButton label="Back to main menu" to="/" />
      </section>
    </AppShell>
  )
}
