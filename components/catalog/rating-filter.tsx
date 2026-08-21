type RatingFilterProps = {
  value: number;
  onChange: (value: number) => void;
};

const ratings = [4.5, 4, 3];

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange(0)} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${value === 0 ? "border-black bg-black text-white" : "border-black/10 bg-white"}`}>
        Any rating
      </button>
      {ratings.map((rating) => (
        <button key={rating} type="button" onClick={() => onChange(rating)} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${value === rating ? "border-black bg-black text-white" : "border-black/10 bg-white"}`}>
          ★ {rating}+ 
        </button>
      ))}
    </div>
  );
}
