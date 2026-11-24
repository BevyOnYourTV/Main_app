import { useParams } from 'react-router'

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()

  if (!roomCode) {
    return <p>Room code is missing.</p>
  }

  return <p>Room code: {roomCode}</p>
}