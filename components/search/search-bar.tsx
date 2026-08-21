export function SearchBar() {
  return (
    <form action="/search" className="group relative" role="search">
      <label htmlFor="site-search" className="sr-only">
        Search Nexora
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder="Search products, brands and categories"
        className="h-11 w-full rounded-full border border-black/10 bg-white pl-5 pr-24 text-sm font-medium outline-none transition placeholder:text-black/35 focus:border-black/30 focus:shadow-[0_0_0_4px_rgba(215,255,71,0.22)]"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-8 rounded-full bg-[#CDEBFF] px-4 text-xs font-black text-black transition hover:bg-[#B8E1FA]"
      >
        Search
      </button>
    </form>
  );
}

