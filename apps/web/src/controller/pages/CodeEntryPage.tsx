import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/button'
import { RoomCodeKeypad } from '../components/RoomCodeKeypad'

export function CodeEntryPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh w-full flex-col justify-center gap-7 bg-card p-6 text-left sm:min-h-0 sm:max-w-md sm:rounded-3xl sm:p-8 sm:shadow-xl sm:shadow-black/20"> 
      <Button
        className="w-full"
        onClick={() => navigate('/name')}
        size="game"
        type="button"
        variant="surface"
      >
        Change name
      </Button>

      <RoomCodeKeypad />

      <Button
        className="w-full"
        onClick={() => navigate('/')}
        size="game"
        type="button"
        variant="surface"
      >
        How to get the code
      </Button>
    </div>
  )
}
