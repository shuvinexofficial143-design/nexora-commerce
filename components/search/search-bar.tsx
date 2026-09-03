export function SearchBar() {
  return (
    <form action="/search" className="group relative" role="search">
      <label htmlFor="site-search" className="sr-only">
        Search Prakriti Ganesh
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder="Search Shadu Mati, Seed Ganesh, size..."
        className="h-11 w-full rounded-full border border-[#1f3a2e]/10 bg-white pl-5 pr-24 text-sm font-medium outline-none transition placeholder:text-[#1f3a2e]/35 focus:border-[#1f3a2e]/30 focus:shadow-[0_0_0_4px_rgba(220,232,207,0.7)]"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-8 rounded-full bg-[#dce8cf] px-4 text-xs font-black text-[#1f3a2e] transition hover:bg-[#cbdcbc]"
      >
        Search
      </button>
    </form>
  );
}
