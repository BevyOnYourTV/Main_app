import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect } from 'react'
import { MainMenuCard } from './MainMenuCard'

const menuItems = [
  { focusKey: 'MAIN_MENU_GAMES', label: 'Games', to: 'games' },
  { focusKey: 'MAIN_MENU_LOBBY', label: 'Lobby', to: 'lobby' },
  { focusKey: 'MAIN_MENU_SETTINGS', label: 'Settings', to: 'settings' },
]

export function MainMenu() {
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'MAIN_MENU',
    preferredChildFocusKey: 'MAIN_MENU_GAMES',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <FocusContext.Provider value={focusKey}>
      <nav aria-label="Console main menu" ref={ref}>
        <ul className="grid list-none grid-cols-1 gap-5 rounded-3xl border border-primary/50 bg-primary/15 p-5 sm:grid-cols-3 sm:gap-6 sm:p-7 lg:gap-10 lg:p-10">
          {menuItems.map((item) => (
            <li className="flex" key={item.focusKey}>
              <MainMenuCard {...item} />
            </li>
          ))}
        </ul>
      </nav>
    </FocusContext.Provider>
  )
}
