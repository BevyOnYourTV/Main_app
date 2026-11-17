import { useState } from 'react'
import { Button } from '../../components/ui/button'

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

type RoomCodeKeypadProps = {
  onConfirm?: (code: string) => void
}

export function RoomCodeKeypad({ onConfirm }: RoomCodeKeypadProps) {
  const [code, setCode] = useState('')

  const appendDigit = (digit: string) => {
    setCode((currentCode) => `${currentCode}${digit}`.slice(0, 6))
  }

  const deleteDigit = () => {
    setCode((currentCode) => currentCode.slice(0, -1))
  }

  return (
    <div className="flex flex-col gap-5">
      <output
        aria-label="Room code"
        className="flex min-h-16 items-center justify-center rounded-xl bg-background px-4 text-center text-2xl font-bold tracking-[0.35em] text-foreground"
      >
        {code || '------'}
      </output>

      <div aria-label="Numeric room code keypad" className="grid grid-cols-3 gap-3" role="group">
        {digits.map((digit) => (
          <Button
            aria-label={`Enter ${digit}`}
            className="w-full"
            key={digit}
            onClick={() => appendDigit(digit)}
            size="controller"
            type="button"
            variant="surface"
          >
            {digit}
          </Button>
        ))}
        <Button
          aria-label="Delete last digit"
          className="w-full"
          disabled={!code}
          onClick={deleteDigit}
          size="controller"
          type="button"
          variant="surface"
        >
          Delete
        </Button>
        <Button
          aria-label="Enter 0"
          className="w-full"
          onClick={() => appendDigit('0')}
          size="controller"
          type="button"
          variant="surface"
        >
          0
        </Button>
        <Button
          className="w-full"
          disabled={!code}
          onClick={() => onConfirm?.(code)}
          size="controller"
          type="button"
        >
          OK
        </Button>
      </div>
    </div>
  )
}
