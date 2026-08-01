export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-40 bg-surface-hover rounded" />
        <div className="h-4 w-32 bg-surface-hover rounded mt-2" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-surface-hover rounded-xl" />
        ))}
      </div>
    </div>
  );
}
