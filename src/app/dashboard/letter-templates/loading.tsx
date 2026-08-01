export default function LetterTemplatesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-surface-hover rounded" />
          <div className="h-4 w-32 bg-surface-hover rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-surface-hover rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-surface-hover rounded-xl" />
        ))}
      </div>
    </div>
  );
}
