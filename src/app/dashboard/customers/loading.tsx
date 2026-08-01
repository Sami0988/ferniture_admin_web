export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-surface-hover rounded" />
          <div className="h-4 w-24 bg-surface-hover rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-surface-hover rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-80 bg-surface-hover rounded-lg" />
        <div className="h-10 w-48 bg-surface-hover rounded-lg" />
      </div>
      <div className="h-96 bg-surface-hover rounded-xl" />
    </div>
  );
}
