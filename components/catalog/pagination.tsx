type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Product pages" className="mt-10 flex items-center justify-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black disabled:opacity-30">Previous</button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
        <button key={item} type="button" aria-current={page === item ? "page" : undefined} onClick={() => onChange(item)} className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${page === item ? "bg-black text-white" : "border border-black/10 bg-white"}`}>{item}</button>
      ))}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black disabled:opacity-30">Next</button>
    </nav>
  );
}
