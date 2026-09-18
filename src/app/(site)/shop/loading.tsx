export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8">
      <div className="border-b hairline pb-8">
        <div className="h-3 w-20 rounded bg-[#efe9db]" />
        <div className="mt-3 h-9 w-56 rounded bg-[#efe9db]" />
      </div>
      <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-[220px_1fr]">
        <div className="hidden md:block">
          <div className="h-64 rounded-xl bg-[#efe9db]" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] w-full rounded-xl bg-[#efe9db]" />
              <div className="mt-3 h-3 w-20 rounded bg-[#efe9db]" />
              <div className="mt-2 h-4 w-32 rounded bg-[#efe9db]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
