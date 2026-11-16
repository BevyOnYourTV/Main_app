import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect } from 'react'
import { AppShell } from '../../shared/components/AppShell'
import { FullscreenButton } from '../components/FullscreenButton'
import { SpatialLinkButton } from '../components/SpatialLinkButton'

export function SettingsPage() {
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'SETTINGS_PAGE',
    preferredChildFocusKey: 'SETTINGS_FULLSCREEN',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <AppShell surface="Console">
      <FocusContext.Provider value={focusKey}>
        <section
          ref={ref}
          aria-labelledby="settings-heading"
          className="flex max-w-2xl flex-col items-center gap-6"
        >
          <h1 id="settings-heading" className="text-4xl font-bold">
            Settings
          </h1>
          <p className="text-lg">
            Adjust console and accessibility preferences.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <FullscreenButton />
            <SpatialLinkButton
              focusKey="SETTINGS_BACK"
              label="Back to main menu"
              to="/"
              variant="secondary"
            />
          </div>
        </section>
      </FocusContext.Provider>
    </AppShell>
  )
}
