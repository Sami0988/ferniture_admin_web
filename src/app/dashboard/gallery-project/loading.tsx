export default function GalleryProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-surface-hover rounded" />
          <div className="h-4 w-32 bg-surface-hover rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-surface-hover rounded-lg" />
      </div>
      <div className="h-96 bg-surface-hover rounded-xl" />
    </div>
  );
}
