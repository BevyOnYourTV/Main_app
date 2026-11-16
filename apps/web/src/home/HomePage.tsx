import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect, type ReactNode } from 'react'

type HomeChoiceProps = {
  accessibilityLabel: string
  children: ReactNode
  focusKey: string
  href: string
  tone: 'console' | 'controller'
}

function HomeChoice({
  accessibilityLabel,
  children,
  focusKey,
  href,
  tone,
}: HomeChoiceProps) {
  const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
    accessibilityLabel,
    focusKey,
    onEnterPress: () => ref.current?.click(),
  })

  return (
    <a
      ref={ref}
      className="home-choice group"
      data-spatial-focused={focused}
      data-tone={tone}
      href={href}
    >
      {children}
    </a>
  )
}

export function HomePage() {
  const { ref, focusKey, focusSelf } = useFocusable<object, HTMLElement>({
    focusKey: 'HOME_CHOICES',
    preferredChildFocusKey: 'HOME_CONSOLE',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden px-6 py-12 sm:px-10 lg:px-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,_rgba(0,102,204,0.3),_transparent_65%)]"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-10 text-center sm:mb-14">
          <p className="mb-4 text-sm font-bold tracking-[0.28em] text-blue-300 uppercase">
            AirConsole
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Choose your screen
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-air-copy sm:text-lg">
            Open the console on the shared TV or computer. Players join from
            their phones using the controller.
          </p>
        </header>

        <FocusContext.Provider value={focusKey}>
          <section
            ref={ref}
            className="grid gap-5 md:grid-cols-2"
            aria-label="Choose an AirConsole application"
          >
            <HomeChoice
              accessibilityLabel="Open the console on a TV or desktop"
              focusKey="HOME_CONSOLE"
              href="/console/"
              tone="console"
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <span className="grid size-14 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                  <svg
                    className="size-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="13" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </span>
                <span className="rounded-full border border-air-border px-3 py-1 text-xs font-semibold tracking-wide text-air-muted uppercase">
                  TV or desktop
                </span>
              </div>
              <h2 className="text-2xl font-bold">Open console</h2>
              <p className="mt-3 leading-7 text-air-copy">
                Browse games, create the lobby, and show gameplay on the shared
                screen.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-300">
                Continue as console
                <span
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
            </HomeChoice>

            <HomeChoice
              accessibilityLabel="Open the controller on a phone or tablet"
              focusKey="HOME_CONTROLLER"
              href="/controller/"
              tone="controller"
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <span className="grid size-14 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                  <svg
                    className="size-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden="true"
                  >
                    <rect x="6" y="2" width="12" height="20" rx="3" />
                    <path d="M10 18h4" />
                  </svg>
                </span>
                <span className="rounded-full border border-air-border px-3 py-1 text-xs font-semibold tracking-wide text-air-muted uppercase">
                  Phone or tablet
                </span>
              </div>
              <h2 className="text-2xl font-bold">Open controller</h2>
              <p className="mt-3 leading-7 text-air-copy">
                Join a lobby, choose your identity, and use this device as your
                controller.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-semibold text-violet-300">
                Continue as controller
                <span
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
            </HomeChoice>
          </section>
        </FocusContext.Provider>

        <p className="mt-8 text-center text-sm text-air-muted">
          For the best experience, open the console first and keep it visible
          while players connect.
        </p>
      </div>
    </main>
  )
}
