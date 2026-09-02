export default function ProformasLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-hover rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-36 bg-surface-hover rounded-lg animate-pulse" />
      </div>
      <div className="h-10 w-full bg-surface-hover rounded-lg animate-pulse" />
      <div className="h-96 w-full bg-surface-hover rounded-xl animate-pulse" />
    </div>
  );
}
