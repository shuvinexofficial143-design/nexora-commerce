import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "dark" | "light" | "accent" | "outline";
  className?: string;
};

const variants = {
  dark: "bg-black text-white hover:bg-[#282824]",
  light: "bg-white text-black hover:bg-white/90",
  accent: "bg-[#d7ff47] text-black hover:bg-[#c6f733]",
  outline: "border border-black/15 bg-transparent text-black hover:bg-black hover:text-white",
};

export function Button({ children, href, variant = "dark", className = "" }: ButtonProps) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-black transition duration-200 hover:-translate-y-0.5 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}
