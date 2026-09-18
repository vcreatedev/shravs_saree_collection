export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-5 py-10 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-[4/5] w-full rounded-2xl bg-[#efe9db]" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-[#efe9db]" />
          <div className="h-9 w-3/4 rounded bg-[#efe9db]" />
          <div className="h-5 w-32 rounded bg-[#efe9db]" />
          <div className="h-7 w-28 rounded bg-[#efe9db]" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-[#efe9db]" />
            <div className="h-4 w-5/6 rounded bg-[#efe9db]" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-9 w-9 rounded-full bg-[#efe9db]" />
            <div className="h-9 w-9 rounded-full bg-[#efe9db]" />
            <div className="h-9 w-9 rounded-full bg-[#efe9db]" />
          </div>
          <div className="flex gap-3 pt-6">
            <div className="h-12 flex-1 rounded-full bg-[#efe9db]" />
            <div className="h-12 flex-1 rounded-full bg-[#efe9db]" />
          </div>
        </div>
      </div>
    </div>
  );
}
