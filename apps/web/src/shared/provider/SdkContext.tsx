import { createContext, useContext, type ReactNode, useEffect, useState } from 'react';
import { io } from 'socket.io-client'


type SdkContextType = {
    roomCode: string | null;
    roomState: any;
    sendInput: any;
};


const SdkContext = createContext<SdkContextType | undefined>(undefined);

const socket = io('http://localhost:3000/realtime', {
  autoConnect: false,
})

type SdkProps = {
    device_type : string,
    children : ReactNode
}

export function SdkProvider( { children, device_type } : SdkProps) {
    const [roomCode, setRoomCode] = useState<string | null>(null)
    const [roomState, setRoomState] = useState<any>(null)

    useEffect(() => {
        const handleConnect = () => {
            socket.emit('session:hello', {
                v: 0.2,
                timestamp: Date.now(),
                payload: { role: device_type },
            })
        }

        const handleSessionReady = ({ payload }: any) => {
            sessionStorage.setItem('sessionToken', payload.sessionToken)

            socket.emit('room:create', {
                v: 0.2,
                timestamp: Date.now(),
                payload: {},
            })
        }

        const handleRoomCreated = ({ payload }: any) => {
            setRoomCode(payload.roomCode)
        }

        const handleRoomState = ({ payload }: any) => {
            setRoomState(payload)
        }

        socket.on('connect', handleConnect)
        socket.on('session:ready', handleSessionReady)
        socket.on('room:created', handleRoomCreated)
        socket.on('room:state', handleRoomState)

        socket.connect()

        return () => {
            socket.off('connect', handleConnect)
            socket.off('session:ready', handleSessionReady)
            socket.off('room:created', handleRoomCreated)
            socket.off('room:state', handleRoomState)
            socket.disconnect()
        }
    }, [])


    return (
        <SdkContext.Provider value={{
             roomCode,
             roomState,
             sendInput,
        }}>
            
            {children}
        </SdkContext.Provider>
    );
}



export function useSdk() {
    const context = useContext(SdkContext);

    if (context === undefined) {
        throw new Error("useSdk must be used within a SdkProvider");
    }

    return context;
}