export default function Loading() {
  return (
    <div className="w-full animate-pulse px-4 py-8">
      <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="h-10 flex-1 rounded-md bg-surface" />
          <div className="h-10 w-36 rounded-md bg-surface md:w-44" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-full bg-surface" />
          <div className="h-10 w-36 rounded-md bg-surface md:w-40" />
          <div className="h-10 w-10 rounded-md bg-surface" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-paper shadow-md">
            <div className="aspect-[4/5] w-full bg-surface" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-surface" />
              <div className="h-4 w-1/3 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
