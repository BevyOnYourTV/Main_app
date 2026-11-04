import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import type { VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type SpatialLinkButtonProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    focusKey?: string
    icon?: LucideIcon
    iconPosition?: 'start' | 'end'
    label: string
  }

export function SpatialLinkButton({
  className,
  focusKey,
  icon: Icon,
  iconPosition = 'start',
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
      {Icon && iconPosition === 'start' ? (
        <Icon aria-hidden="true" data-icon="inline-start" />
      ) : null}
      {label}
      {Icon && iconPosition === 'end' ? (
        <Icon aria-hidden="true" data-icon="inline-end" />
      ) : null}
    </Link>
  )
}
