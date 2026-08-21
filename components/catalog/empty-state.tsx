type EmptyStateProps = {
  onReset: () => void;
};

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-black/15 bg-white px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#d7ff47] text-2xl">⌕</div>
      <h2 className="mt-4 text-2xl font-black tracking-tight">No exact matches</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-black/50">Try widening your price range, selecting another brand, or clearing a few filters.</p>
      <button type="button" onClick={onReset} className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-black text-white">Reset filters</button>
    </div>
  );
}
