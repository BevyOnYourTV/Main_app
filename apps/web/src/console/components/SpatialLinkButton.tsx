import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import type { VariantProps } from 'class-variance-authority'
import { Link, type LinkProps } from 'react-router'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type SpatialLinkButtonProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    focusKey?: string
    label: string
  }

export function SpatialLinkButton({
  className,
  focusKey,
  label,
  size = 'lg',
  variant = 'default',
  ...linkProps
}: SpatialLinkButtonProps) {
  const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
    accessibilityLabel: label,
    focusKey,
    onEnterPress: () => ref.current?.click(),
  })

  return (
    <Link
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        'tv-spatial-button',
        className,
      )}
      data-spatial-focused={focused}
      {...linkProps}
    >
      {label}
    </Link>
  )
}
