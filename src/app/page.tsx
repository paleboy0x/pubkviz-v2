export const dynamic = "force-dynamic";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatCategoryLabel,
  DIFFICULTY_LABELS_HR,
  formatQuestionCount,
} from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CATEGORY_LIST, DIFFICULTY_LEVELS } from "@/lib/constants";
import type { Bundle } from "@/lib/types/database";

async function getStats() {
  try {
    // Anon RLS: samo odobrena pitanja i aktivni paketi — ne treba service_role.
    const supabase = await createServerSupabaseClient();

    const { count: totalCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const categoryStats: { category: string; count: number }[] = [];
    for (const cat of CATEGORY_LIST) {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("category", cat);
      if ((count ?? 0) > 0) {
        categoryStats.push({ category: cat, count: count ?? 0 });
      }
    }

    const difficultyStats: { difficulty: number; count: number }[] = [];
    for (const d of DIFFICULTY_LEVELS) {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("difficulty", d);
      difficultyStats.push({ difficulty: d, count: count ?? 0 });
    }

    const { data: bundlesData } = await supabase
      .from("bundles")
      .select("*")
      .eq("is_active", true)
      .order("question_count", { ascending: true });

    return {
      total: totalCount ?? 0,
      categories: categoryStats,
      difficulties: difficultyStats,
      bundles: (bundlesData ?? []) as Bundle[],
    };
  } catch {
    return { total: 0, categories: [], difficulties: [], bundles: [] };
  }
}

function catalogCountLine(total: number): string {
  return `Provjerenih pitanja u katalogu: ${total.toLocaleString("hr-HR")}.`;
}

function difficultyLabelForLanding(level: number): string {
  if (level === 2 || level === 4) return "";
  return DIFFICULTY_LABELS_HR[level] ?? "";
}

function packageHighlights(
  name: string,
  count: number,
  index: number,
  total: number
): string[] {
  const normalized = name.toLowerCase();
  const isSmall = normalized.includes("mali") || index === 0;
  const isMiddle = normalized.includes("srednji") || index === Math.floor(total / 2);
  const isLarge = normalized.includes("veliki") || index === total - 1;

  if (isSmall) {
    return [
      `Idealno za brzi pub krug (${formatQuestionCount(count)})`,
      "Lak početak za testnu ili kraću večer",
      "Filtar po kategoriji i težini",
      "Bez ponavljanja istog pitanja",
    ];
  }

  if (isMiddle) {
    return [
      `Najbolji omjer opsega i ritma (${formatQuestionCount(count)})`,
      "Dovoljno sadržaja za punu večer kviza",
      "Filtar po kategoriji i težini",
      "Dodjela odmah nakon uspješnog plaćanja",
    ];
  }

  if (isLarge) {
    return [
      `Maksimalan fond za duže događaje (${formatQuestionCount(count)})`,
      "Stvoren za turnire i višekratno korištenje",
      "Filtar po kategoriji i težini",
      "Bez ponavljanja istog pitanja",
    ];
  }

  return [
    `Paket s ${formatQuestionCount(count)}`,
    "Provjerena pitanja spremna za kviz",
    "Filtar po kategoriji i težini",
    "Dodjela odmah nakon uspješnog plaćanja",
  ];
}

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#030304] text-[#ececf1]">
      {/* Ambient orbs (background motion) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-[20%] top-[-10%] h-[70vmin] w-[70vmin] rounded-full bg-gradient-to-br from-[#3a3a44]/40 via-[#8a8a98]/25 to-transparent blur-[80px] animate-liquid-1"
          aria-hidden
        />
        <div
          className="absolute -right-[15%] top-[20%] h-[55vmin] w-[55vmin] rounded-full bg-gradient-to-bl from-[#c8c8d4]/20 via-[#5a5a64]/30 to-transparent blur-[90px] animate-liquid-2"
          aria-hidden
        />
        <div
          className="absolute bottom-[-20%] left-[30%] h-[60vmin] w-[60vmin] rounded-full bg-gradient-to-t from-[#2a2a32]/50 via-[#6e6e7a]/20 to-transparent blur-[100px] animate-liquid-3"
          aria-hidden
        />
        <div className="metal-noise absolute inset-0" aria-hidden />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#030304]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-2xl tracking-[0.12em] text-[#ececf1] sm:text-[1.65rem]"
          >
            PUBKVIZ
          </Link>

          <nav className="hidden items-center gap-10 text-[13px] font-medium tracking-wide text-[#8b8b96] sm:flex">
            <a href="#about" className="transition-colors hover:text-[#ececf1]">
              O nama
            </a>
            <a href="#stats" className="transition-colors hover:text-[#ececf1]">
              Statistika
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#ececf1]">
              Cijene
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-[13px] font-medium text-[#8b8b96] transition-colors hover:text-[#ececf1]"
            >
              Prijava
            </Link>
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "border border-white/15 bg-gradient-to-b from-[#e8e8ee] to-[#a8a8b4] px-5 text-[13px] font-semibold text-[#0a0a0c] shadow-[0_0_24px_-4px_rgba(200,200,212,0.35)] hover:from-[#f4f4f8] hover:to-[#b8b8c4]"
              )}
            >
              Registracija
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate px-6 pb-16 pt-14 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[#9b9ba8]">
            <span className="h-1 w-1 rounded-full bg-[#c8c8d4] shadow-[0_0_8px_#e0e0e8]" />
            Pitanja za pub kviz
          </p>

          <h1 className="font-display text-[clamp(3rem,12vw,7rem)] leading-[0.92] tracking-[0.02em] text-[#f4f4f8]">
            KVIZ PITANJA
            <br />
            <span className="text-chrome">SPREMNA ZA TVOJ PUB</span>
          </h1>

          <p className="mx-auto mt-8 max-w-lg text-[16px] leading-relaxed text-[#8b8b96]">
            Kupiš paket pitanja, filtriraš po želji ili uzmeš mješavinu. Isto pitanje ne dolazi
            dvaput — pamti se za tvoj račun.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-none border border-white/20 bg-gradient-to-b from-[#ececf1] to-[#9a9aa8] px-8 text-[14px] font-bold uppercase tracking-widest text-[#08080a] shadow-[0_0_40px_-8px_rgba(220,220,230,0.45)] hover:from-white hover:to-[#a8a8b4]"
              )}
            >
              Otvori račun
            </Link>
            <a
              href="#pricing"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 rounded-none border-white/20 bg-transparent px-8 text-[14px] font-semibold uppercase tracking-widest text-[#ececf1] hover:bg-white/5"
              )}
            >
              Paketi
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-white/[0.06] px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-xl">
            <p className="mb-3 font-display text-xl tracking-[0.2em] text-[#9b9ba8]">
              ZAŠTO PUBKVIZ
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#ececf1] sm:text-4xl">
              Jednostavno za voditelja, jasno za ekipu.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#8b8b96]">
              Za pub, društvo ili posao: kupiš set pitanja i dobiješ ih na račun. Sadržaj je
              moderiran i provjeren prije nego uđe u katalog — koristiš pouzdana i uredno
              obrađena pitanja.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Bez ponavljanja",
                desc: "Isto pitanje ti se ne pojavljuje ponovo nakon što ga jednom dobiješ.",
              },
              {
                title: "Tvoj odabir",
                desc: "Možeš filtrirati kategoriju i težinu ili uzeti potpuno nasumično.",
              },
              {
                title: "Brzo na račun",
                desc: "Nakon kupnje pitanja su odmah u tvom profilu — bez čekanja.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="metal-edge group rounded-2xl p-8 transition-[transform,box-shadow] duration-500 hover:-translate-y-0.5"
              >
                <div className="mb-4 h-px w-12 bg-gradient-to-r from-[#c8c8d4] to-transparent" />
                <h3 className="font-display text-xl tracking-[0.08em] text-[#ececf1]">
                  {f.title.toUpperCase()}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#8b8b96]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="border-t border-white/[0.06] px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 font-display text-xl tracking-[0.2em] text-[#9b9ba8]">
              PREGLED KATALOGA
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#ececf1] sm:text-4xl">
              Dostupni sadržaj
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#8b8b96]">
              {stats.total > 0
                ? catalogCountLine(stats.total)
                : "Katalog se priprema — ovdje će uskoro biti vidljiv broj provjerenih pitanja."}
            </p>
          </div>

          {stats.total > 0 && (
            <div className="space-y-8">
              {stats.categories.length > 0 && (
                <div>
                  <h3 className="mb-5 font-display text-sm tracking-[0.25em] text-[#6b6b78]">
                    KATEGORIJA
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.categories.map((cat) => (
                      <div
                        key={cat.category}
                        className="metal-edge flex items-center justify-between rounded-xl px-5 py-4"
                      >
                        <span className="text-[14px] text-[#c8c8d4]">
                          {formatCategoryLabel(cat.category)}
                        </span>
                        <span className="font-mono text-sm tabular-nums text-[#ececf1]">
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-5 font-display text-sm tracking-[0.25em] text-[#6b6b78]">
                  TEŽINA
                </h3>
                <div className="flex flex-wrap gap-3">
                  {stats.difficulties.map((d) => (
                    <div
                      key={d.difficulty}
                      className="metal-edge flex min-w-[200px] flex-1 items-center gap-4 rounded-xl px-5 py-4 sm:max-w-[280px]"
                    >
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 w-5 rounded-sm",
                              i < d.difficulty
                                ? "bg-gradient-to-t from-[#5a5a64] to-[#d4d4dc]"
                                : "bg-white/10"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[12px] uppercase tracking-wider text-[#6b6b78]">
                        {difficultyLabelForLanding(d.difficulty)}
                      </span>
                      <span className="ml-auto font-mono text-sm tabular-nums text-[#ececf1]">
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stats.total === 0 && (
            <div className="metal-edge rounded-2xl px-8 py-14 text-center">
              <p className="text-[15px] text-[#6b6b78]">
                Još nema pitanja u javnom katalogu. Prikazuju se samo provjerena pitanja nakon
                završene moderacije.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="pricing" className="border-t border-white/[0.06] px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 font-display text-xl tracking-[0.2em] text-[#9b9ba8]">
              PAKETI
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#ececf1] sm:text-4xl">
              Odaberi paket
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#8b8b96]">
              Jednokratna kupnja. Bez pretplate.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(stats.bundles.length > 0
              ? stats.bundles.map((b) => ({
                  name: b.name,
                  count: b.question_count,
                  id: b.id,
                }))
              : [
                  { name: "Mali", count: 25, id: "small" },
                  { name: "Srednji", count: 50, id: "medium" },
                  { name: "Veliki", count: 100, id: "large" },
                ]
            ).map((bundle, i, arr) => {
              const isPopular = i === 1 && arr.length === 3;
              return (
                <div
                  key={bundle.id}
                  className={cn(
                    "metal-edge relative flex flex-col rounded-2xl p-8",
                    isPopular &&
                      "ring-1 ring-[#c8c8d4]/40 shadow-[0_0_60px_-12px_rgba(200,200,212,0.25)]"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="font-display whitespace-nowrap bg-gradient-to-b from-[#ececf1] to-[#9898a4] px-4 py-1 text-[10px] tracking-[0.2em] text-[#0a0a0c]">
                        NAJPOPULARNIJI
                      </span>
                    </div>
                  )}

                  <h3 className="font-display text-3xl tracking-[0.06em] text-[#ececf1]">
                    {bundle.name.toUpperCase()}
                  </h3>
                  <p className="mt-2 font-mono text-sm text-[#6b6b78]">
                    {formatQuestionCount(bundle.count)}
                  </p>

                  <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <ul className="flex-1 space-y-3 text-[13px] text-[#9b9ba8]">
                    {packageHighlights(bundle.name, bundle.count, i, arr.length).map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="text-[#c8c8d4]">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className={cn(
                      "mt-10 flex h-11 items-center justify-center text-[12px] font-bold uppercase tracking-[0.2em] transition-all",
                      isPopular
                        ? "border border-white/10 bg-gradient-to-b from-[#ececf1] to-[#8e8e9c] text-[#08080a] hover:brightness-110"
                        : "border border-white/15 text-[#ececf1] hover:bg-white/5"
                    )}
                  >
                    Kupi
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="font-display text-sm tracking-[0.15em] text-[#5a5a64]">
            © {new Date().getFullYear()} PUBKVIZ
          </p>
          <div className="flex gap-10 text-[12px] font-medium uppercase tracking-widest text-[#6b6b78]">
            <Link href="/auth/login" className="hover:text-[#ececf1]">
              Prijava
            </Link>
            <Link href="/auth/register" className="hover:text-[#ececf1]">
              Registracija
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
