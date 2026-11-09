import type { ReactNode } from 'react'
import { SkipLink } from '../accessibility/SkipLink'
import { appName } from '../configuration/app'

type AppShellProps = {
  children: ReactNode
  surface: 'Console' | 'Controller'
}

export function AppShell({ children, surface }: AppShellProps) {
  const mainId = 'main-content'

  return (
    <>
      <SkipLink targetId={mainId} />
      <header className="flex justify-between border-b border-air-border px-6 py-4 font-bold text-air-foreground">
        <span>{appName}</span>
        <span className="font-medium text-air-muted">{surface}</span>
      </header>
      <main
        id={mainId}
        className="grid min-h-[calc(100vh-57px)] place-items-center bg-air-background p-8 text-center [&_h1]:mb-3 [&_p]:m-0 [&_p]:text-air-copy"
      >
        {children}
      </main>
    </>
  )
}
