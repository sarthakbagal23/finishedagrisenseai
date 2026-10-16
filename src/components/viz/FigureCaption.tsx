/** Every figure says what it is, where the data came from, and its caveat. */
export function FigureCaption({ title, source, caveat }: { title: string; source: string; caveat?: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-display text-lg font-bold leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">
        {source}
        {caveat && <> {caveat}</>}
      </p>
    </div>
  );
}
