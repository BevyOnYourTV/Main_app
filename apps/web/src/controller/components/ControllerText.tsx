import { MAX_TEXT_LENGTH } from '@platform/sdk'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'

type ControllerTextProps = {
  describedBy?: string
  label: string
  maxLength?: number
  onSubmit: (text: string) => void
  placeholder?: string
}

/** Text entry sent when the player submits it. Empty text is not sent. */
export function ControllerText({
  describedBy,
  label,
  maxLength = MAX_TEXT_LENGTH,
  onSubmit,
  placeholder,
}: ControllerTextProps) {
  const inputId = useId()
  const [text, setText] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setText('')
    }
  }

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <label className="text-lg font-bold" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={describedBy}
        autoComplete="off"
        className="min-h-11 rounded-lg border-2 border-air-border bg-air-surface px-3 text-lg text-air-foreground outline-offset-2 focus-visible:outline-3 focus-visible:outline-air-focus"
        id={inputId}
        maxLength={maxLength}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        value={text}
      />
      <Button size="controller" type="submit">
        Send
      </Button>
    </form>
  )
}
