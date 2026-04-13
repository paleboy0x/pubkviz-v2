import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030304] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[min(80vw,480px)] w-[min(80vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6e6e7a]/10 blur-[120px]" />
        <div className="metal-noise absolute inset-0 opacity-[0.06]" />
      </div>
      <Card
        className={cn(
          "metal-edge relative w-full max-w-md rounded-2xl border-0 bg-[#08080a]/90 text-[#ececf1] backdrop-blur-sm"
        )}
      >
        <CardHeader className="space-y-4 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-[#6b6b78]">GOTOVO</p>
          <CardTitle className="font-display text-3xl tracking-[0.08em]">E-POŠTA POTVRĐENA</CardTitle>
          <CardDescription className="text-[#8b8b96]">
            Možeš se prijaviti.
          </CardDescription>
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants(),
              "rounded-none border border-white/10 bg-gradient-to-b from-[#ececf1] to-[#9a9aa8] font-bold uppercase tracking-widest text-[#08080a] hover:brightness-110"
            )}
          >
            Prijava
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
