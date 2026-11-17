import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/button'
import { ControllerScreen } from '../components/ControllerScreen'

export function NamePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name.trim()) {
      navigate('/code')
    }
  }

  return (
    <ControllerScreen
      description="This is the name other players will see."
      title="Choose your name"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="player-name">
            Player name
          </label>
          <input
            autoComplete="nickname"
            className="min-h-14 w-full rounded-lg bg-background px-4 text-lg text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            id="player-name"
            maxLength={24}
            name="playerName"
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            type="text"
            value={name}
          />
        </div>
        <Button
          className="w-full"
          disabled={!name.trim()}
          size="gameLobbyAction"
          type="submit"
        >
          Validate
        </Button>
      </form>
    </ControllerScreen>
  )
}
