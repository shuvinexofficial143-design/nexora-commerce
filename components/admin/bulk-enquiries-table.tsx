import type {AdminBulkEnquiry,AdminBulkEnquiryStatus} from "@/types/admin";

const tones:Record<AdminBulkEnquiryStatus,string>={
  New:"bg-[#fff0dc] text-[#8a4d17]",
  Contacted:"bg-[#e8f2ff] text-[#225a8a]",
  Quoted:"bg-[#f1e9ff] text-[#604095]",
  Confirmed:"bg-[#e4f5df] text-[#29652c]",
};

export function BulkEnquiriesTable({items}:{items:AdminBulkEnquiry[]}){
  return <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 p-6">
      <div><h2 className="text-xl font-black">Society & bulk enquiries</h2><p className="mt-1 text-sm text-black/45">Large murtis, mandals and gifting requirements</p></div>
      <a href="/bulk-orders" className="rounded-full border border-black/10 px-4 py-2 text-xs font-black">Open customer form ↗</a>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-black/[.03]"><tr>{["Enquiry","Customer / group","City","Requirement","Budget","Needed by","Status"].map(h=><th key={h} className="px-6 py-4">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-black/10">
          {items.map(x=><tr key={x.id}>
            <td className="px-6 py-4 font-black">{x.id}</td>
            <td className="px-6 py-4"><b>{x.name}</b><p className="text-xs text-black/40">{x.organization} · {x.phone}</p></td>
            <td className="px-6 py-4">{x.city}</td>
            <td className="px-6 py-4"><b>{x.size}</b><p className="text-xs text-black/40">Qty {x.quantity}</p></td>
            <td className="px-6 py-4 font-black">{x.budget}</td>
            <td className="px-6 py-4">{x.neededBy}</td>
            <td className="px-6 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${tones[x.status]}`}>{x.status}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>
}
