export function SignalBars({ level }: { level: number }) {
  const bars =
    level < 0.02 ? 0 :
    level < 0.1  ? 1 :
    level < 0.25 ? 2 :
    level < 0.5  ? 3 : 4;

  return (
    <div className="flex items-end gap-[2px] h-4" title={`Уровень: ${Math.round(level * 100)}%`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm transition-all duration-150 ${
            i < bars ? 'bg-green-500' : 'bg-gray-300'
          }`}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  );
}
