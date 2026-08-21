type BadgeProps = {
  children: React.ReactNode;
  tone?: "dark" | "accent" | "warm" | "soft";
};

const tones = {
  dark: "bg-black text-white",
  accent: "bg-[#d7ff47] text-black",
  warm: "bg-[#ffefe1] text-[#7a2b00]",
  soft: "bg-white/80 text-black backdrop-blur",
};

export function Badge({ children, tone = "soft" }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
