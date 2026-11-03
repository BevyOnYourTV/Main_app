import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect } from 'react'
import { SpatialLinkButton } from './SpatialLinkButton'

function ButtonRow() {
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'BUTTON_ROW',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="flex gap-4">
        <SpatialLinkButton label="Play" to="./play" />
        <SpatialLinkButton label="Pause" to="./pause" variant="secondary" />
        <SpatialLinkButton label="Stop" to="./stop" variant="destructive" />
      </div>
    </FocusContext.Provider>
  )
}

export { ButtonRow }
