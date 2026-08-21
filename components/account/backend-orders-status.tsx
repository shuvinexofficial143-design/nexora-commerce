export function BackendOrdersStatus({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-dashed border-black/15 bg-white p-10 text-center">
      <div className="text-5xl">📦</div>
      <h2 className="mt-4 text-2xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm font-bold leading-6 text-black/45">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
