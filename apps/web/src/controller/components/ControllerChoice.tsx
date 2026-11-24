import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ControllerChoiceProps = {
  describedBy?: string
  label: string
  onSelect: (optionId: string) => void
  options: ReadonlyArray<{ id: string; label: string }>
}

export function ControllerChoice({
  describedBy,
  label,
  onSelect,
  options,
}: ControllerChoiceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const select = (optionId: string) => {
    setSelectedId(optionId)
    onSelect(optionId)
  }

  return (
    <fieldset aria-describedby={describedBy} className="grid gap-2 border-0 p-0">
      <legend className="mb-2 text-lg font-bold">{label}</legend>
      {options.map((option) => (
        <Button
          aria-pressed={selectedId === option.id}
          key={option.id}
          onClick={() => select(option.id)}
          size="controller"
          type="button"
          variant={selectedId === option.id ? 'default' : 'outline'}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  )
}
