export default function PaymentLettersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-surface-hover rounded" />
          <div className="h-4 w-28 bg-surface-hover rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-surface-hover rounded-lg" />
      </div>
      <div className="h-96 bg-surface-hover rounded-xl" />
    </div>
  );
}
