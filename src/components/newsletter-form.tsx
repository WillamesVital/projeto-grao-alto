"use client";

/** Decorativo — sem regra de negócio nem backend por trás (fora do escopo do MVP). */
export default function NewsletterForm() {
  return (
    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
      <input
        type="email"
        placeholder="Seu e-mail"
        aria-label="Seu e-mail"
        className="min-w-0 flex-1 rounded border border-white/20 bg-white/10 px-3 py-2 text-body-md text-white placeholder:text-white/60 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded bg-honey-amber px-4 py-2 text-label-md font-bold text-on-secondary"
      >
        OK
      </button>
    </form>
  );
}
