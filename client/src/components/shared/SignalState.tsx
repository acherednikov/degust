type Props = {
  connected: boolean;
  selfSocketId: string | null;
}

export function SignalState({ connected, selfSocketId }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className={connected ? 'text-green-600' : 'text-red-600'}>
        ● {connected ? 'Connected' : 'Disconnected'}
      </span>
      {selfSocketId && <span className="text-xs text-gray-500">you: {selfSocketId}</span>}
    </div>
  )
}
