import type { AuthSession } from "@/types/auth";

export function ProfileCard({ session }: { session: AuthSession }) {
  const initials = session.user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <article className="rounded-3xl border border-black/10 bg-white p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d7ff47] text-lg font-black">{initials}</div><div><p className="text-lg font-black">{session.user.name}</p><p className="text-sm text-black/45">{session.user.email}</p></div></div><dl className="mt-6 grid gap-3 text-sm"><div className="flex justify-between gap-4 rounded-2xl bg-[#f8f8f6] p-4"><dt className="text-black/45">Member tier</dt><dd className="font-black">{session.user.tier}</dd></div><div className="flex justify-between gap-4 rounded-2xl bg-[#f8f8f6] p-4"><dt className="text-black/45">Role</dt><dd className="font-black capitalize">{session.user.role}</dd></div></dl><button className="mt-5 w-full rounded-full border border-black/15 px-4 py-3 text-sm font-black">Edit profile</button></article>;
}
