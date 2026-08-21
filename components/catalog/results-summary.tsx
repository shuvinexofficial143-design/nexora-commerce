type ResultsSummaryProps = {
  visible: number;
  total: number;
};

export function ResultsSummary({ visible, total }: ResultsSummaryProps) {
  return (
    <div>
      <p className="text-lg font-black tracking-tight">All products</p>
      <p className="mt-0.5 text-xs font-semibold text-black/40">Showing {visible} of {total} matching products</p>
    </div>
  );
}
