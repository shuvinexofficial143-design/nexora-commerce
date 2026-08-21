import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
        404
      </span>
      <h1 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
        This aisle does not exist yet.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-black/55 sm:text-base">
        The page may have moved, or it belongs to a feature that will arrive in a later build batch.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
      >
        Back to home
      </Link>
    </Container>
  );
}
