export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="text-center space-y-2">
          <div className="h-10 w-48 bg-surface-hover rounded mx-auto" />
          <div className="h-4 w-64 bg-surface-hover rounded mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-surface-hover rounded-lg" />
          <div className="h-12 bg-surface-hover rounded-lg" />
          <div className="h-12 bg-surface-hover rounded-lg" />
        </div>
      </div>
    </div>
  );
}
