import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/button'
import { ControllerScreen } from '../components/ControllerScreen'

export function ControllerPage() {
  const navigate = useNavigate()

  return (
    <ControllerScreen
      description="Follow these steps on the console, then enter the room code."
      title="Connect your controller"
    >
      <ol className="flex flex-col gap-3" aria-label="How to get a room code">
        <li className="rounded-xl bg-muted/40 p-4">
          <strong>1.</strong> Go to <span className="font-mono">URL_PLACEHOLDER</span>
        </li>
        <li className="rounded-xl bg-muted/40 p-4">
          <strong>2.</strong> Select <q>Lobby</q> on the console.
        </li>
        <li className="rounded-xl bg-muted/40 p-4">
          <strong>3.</strong> Find the numeric code below the QR code.
        </li>
      </ol>

      <Button
        className="w-full"
        onClick={() => navigate('/code')}
        size="gameLobbyAction"
        type="button"
      >
        I have the code
      </Button>
    </ControllerScreen>
  )
}
