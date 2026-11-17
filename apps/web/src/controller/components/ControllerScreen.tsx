import type { ReactNode } from 'react'
import { SkipLink } from '../../shared/accessibility/SkipLink'

type ControllerScreenProps = {
  children: ReactNode
  description?: string
  title: string
}

export function ControllerScreen({
  children,
  description,
  title,
}: ControllerScreenProps) {
  const mainId = 'main-content'

  return (
    <>
      <SkipLink targetId={mainId} />
      <main
        className="grid min-h-svh bg-card text-foreground sm:place-items-center sm:bg-background sm:p-8"
        id={mainId}
      >
      <section
        aria-labelledby="controller-heading"
        className="flex min-h-svh w-full flex-col justify-center gap-7 bg-card p-6 text-left sm:min-h-0 sm:max-w-md sm:rounded-3xl sm:p-8 sm:shadow-xl sm:shadow-black/20"
      >
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold" id="controller-heading">
            {title}
          </h1>
          {description ? <p>{description}</p> : null}
        </div>
        {children}
      </section>
      </main>
    </>
  )
}
