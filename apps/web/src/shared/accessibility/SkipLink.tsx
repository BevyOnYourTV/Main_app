type SkipLinkProps = {
  targetId: string
}

export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      className="fixed top-0 left-4 z-10 -translate-y-[110%] bg-white px-4 py-3 text-air-background transition-transform focus:translate-y-0"
      href={`#${targetId}`}
    >
      Skip to main content
    </a>
  )
}
