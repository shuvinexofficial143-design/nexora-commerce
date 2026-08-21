import type { FilterOption } from "@/types/catalog";

type CheckboxFilterProps = {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
};

export function CheckboxFilter({ options, selected, onToggle }: CheckboxFilterProps) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1 text-sm font-semibold text-black/70 transition hover:text-black">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="h-4 w-4 accent-black"
            />
            <span className="flex-1">{option.label}</span>
            <span className="text-xs font-bold text-black/35">{option.count}</span>
          </label>
        );
      })}
    </div>
  );
}
