export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-52 animate-pulse rounded-full bg-black/10" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[620px] animate-pulse rounded-[32px] bg-white" />
        <div className="h-[420px] animate-pulse rounded-[32px] bg-white" />
      </div>
    </div>
  );
}
