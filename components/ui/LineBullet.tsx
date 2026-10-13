import { lineFor, lineVars } from '@/lib/lines';

// A building's round line bullet ("1", "A"…), sized by the caller (h-/w-/text- classes).
export function LineBullet({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const line = lineFor(id, name);
  return (
    <span aria-hidden className={`bullet ${className}`} style={lineVars(line)}>
      {line.code}
    </span>
  );
}
