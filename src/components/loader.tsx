import { Loader2 } from 'lucide-react';

export function Loader({ text = "Generating Risk Assessment" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-card p-8 text-center shadow-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium text-primary">{text}</p>
      <p className="text-sm text-muted-foreground">The AI is analyzing the data. This may take a moment.</p>
    </div>
  );
}
